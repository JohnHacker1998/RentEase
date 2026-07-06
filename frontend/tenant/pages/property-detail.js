RE.tenantPages = RE.tenantPages || {};

RE.tenantPages.propertyDetail = async function (app, params) {
  const propRes = await RE.api.properties.public(params.id);
  const property = propRes.data;
  const landlord = property.landlord;
  let reviews = [];
  if (landlord) {
    try {
      const reviewsRes = await RE.api.users.reviews(landlord.id, { page: 1, limit: 10 });
      reviews = reviewsRes.data || [];
    } catch { reviews = []; }
  }
  const images = property.images || [];
  const amenities = property.amenities || [];
  const isTenant = RE.auth.isLoggedIn() && RE.auth.hasRole('TENANT');

  app.innerHTML = `
    <div class="page-header">
      <a href="#/" class="btn btn-secondary btn-sm">&larr; Back to browse</a>
    </div>
    <div class="detail-grid">
      <div>
        <h1>${RE.utils.escapeHtml(property.title)}</h1>
        <p class="price" style="font-size:1.5rem;font-weight:700;color:var(--color-primary)">
          ${RE.utils.formatPrice(property.price)} <span class="meta">/month</span>
        </p>
        <p>${RE.utils.escapeHtml(property.address)}, ${RE.utils.escapeHtml(property.city)}, ${RE.utils.escapeHtml(property.state)}</p>
        <p class="meta">${property.bedrooms} bed · ${property.bathrooms} bath · ${property.areaSqft} sqft · ${property.propertyType}</p>
        ${images.length ? `<div class="gallery" style="margin:1rem 0">${images.map((i) => `<img src="${RE.uploadUrl(i.imageUrl)}" alt="">`).join('')}</div>` : ''}
        <h3>Description</h3>
        <p>${RE.utils.escapeHtml(property.description)}</p>
        ${amenities.length ? `<h3>Amenities</h3><div class="chip-list">${amenities.map((a) => `<span class="chip">${RE.utils.escapeHtml(a.name)}</span>`).join('')}</div>` : ''}
      </div>
      <div>
        ${landlord ? `
          <div class="card"><div class="card-body">
            <h3>Landlord</h3>
            <p><strong>${RE.utils.escapeHtml(RE.utils.fullName(landlord))}</strong></p>
            <p class="meta">${RE.utils.escapeHtml(landlord.email)}</p>
            <p class="meta">${RE.utils.escapeHtml(landlord.phone)}</p>
          </div></div>` : ''}
        <div class="card" style="margin-top:1rem"><div class="card-body">
          <h3>Apply for this property</h3>
          ${isTenant ? `
            <form id="apply-form">
              <div class="form-group">
                <label>Message (optional)</label>
                <textarea name="message" rows="3" placeholder="Tell the landlord about yourself..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Submit Application</button>
            </form>` : `
            <p class="meta">${RE.auth.isLoggedIn() ? 'Only tenants can apply.' : 'Please log in as a tenant to apply.'}</p>
            <a href="#/login" class="btn btn-primary btn-block">Log In</a>`}
        </div></div>
        ${reviews.length ? `
          <div class="card" style="margin-top:1rem"><div class="card-body">
            <h3>Landlord Reviews</h3>
            ${reviews.map((r) => `<div style="margin-bottom:0.75rem">
              <span class="rating">${RE.ui.stars(r.rating)}</span>
              <p class="meta">${RE.utils.formatDate(r.createdAt)}</p>
              ${r.comment ? `<p>${RE.utils.escapeHtml(r.comment)}</p>` : ''}
            </div>`).join('')}
          </div></div>` : ''}
      </div>
    </div>`;

  const gallery = app.querySelector('.gallery');
  if (gallery) RE.ui.bindZoomableImages(gallery);

  if (isTenant) {
    const form = app.querySelector('#apply-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await RE.api.applications.create({
          propertyId: property.id,
          message: form.message.value || undefined,
        });
        RE.ui.toast('Application submitted!', 'success');
        location.hash = '#/applications';
      } catch (err) {
        RE.ui.toast(RE.api.handleError(err).message, 'error');
      }
    };
  }
};
