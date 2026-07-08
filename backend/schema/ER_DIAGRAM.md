# RentEase Entity-Relationship Diagram

Visual reference for the RentEase PostgreSQL schema (10 tables). The canonical DDL is in [`schema.sql`](schema.sql); runtime schema evolution is managed by Sequelize migrations in [`../migrations/`](../migrations/).

## Diagram

```mermaid
erDiagram
    users ||--o| landlord_verifications : "user_id"
    users ||--o{ landlord_verifications : "verified_by"
    users ||--o{ properties : "landlord_id"
    users ||--o{ applications : "tenant_id"
    users ||--o{ reviews : "reviewer_id"
    users ||--o{ reviews : "reviewee_id"
    users ||--o{ conversations : "tenant_id"
    users ||--o{ conversations : "landlord_id"
    users ||--o{ messages : "sender_id"

    properties ||--o{ property_images : "property_id"
    properties ||--o{ property_amenities : "property_id"
    amenities ||--o{ property_amenities : "amenity_id"
    properties ||--o{ applications : "property_id"
    properties ||--o{ reviews : "property_id"
    properties ||--o{ conversations : "property_id"

    conversations ||--o{ messages : "conversation_id"

    users {
        uuid id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar password
        varchar phone
        enum role "TENANT | LAND_LORD | ADMIN"
        varchar profile_image
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    landlord_verifications {
        uuid id PK
        uuid user_id FK_UK
        enum status "PENDING | VERIFIED | REJECTED"
        varchar verification_document
        text rejection_reason
        uuid verified_by FK
        timestamptz verified_at
        timestamptz created_at
        timestamptz updated_at
    }

    properties {
        uuid id PK
        uuid landlord_id FK
        varchar title
        text description
        varchar address
        varchar city
        varchar state
        decimal price
        enum property_type "APARTMENT | HOUSE | CONDO | STUDIO"
        int bedrooms
        int bathrooms
        int area_sqft
        enum status "AVAILABLE | RESERVED | RENTED | INACTIVE"
        boolean is_approved
        text rejection_reason
        timestamptz created_at
        timestamptz updated_at
    }

    property_images {
        uuid id PK
        uuid property_id FK
        varchar image_url
        boolean is_cover
        int display_order
        timestamptz created_at
    }

    amenities {
        uuid id PK
        varchar name UK
        timestamptz created_at
        timestamptz updated_at
    }

    property_amenities {
        uuid id PK
        uuid property_id FK
        uuid amenity_id FK
    }

    applications {
        uuid id PK
        uuid property_id FK
        uuid tenant_id FK
        text message
        enum status "PENDING | APPROVED | REJECTED | WITHDRAWN | CANCELLED | COMPLETED"
        timestamptz created_at
        timestamptz updated_at
    }

    reviews {
        uuid id PK
        uuid reviewer_id FK
        uuid reviewee_id FK
        uuid property_id FK
        enum target_type "LANDLORD | TENANT"
        int rating "1-5"
        text comment
        timestamptz created_at
        timestamptz updated_at
    }

    conversations {
        uuid id PK
        uuid property_id FK
        uuid tenant_id FK
        uuid landlord_id FK
        timestamptz last_message_at
        timestamptz created_at
        timestamptz updated_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text message
        boolean is_read
        timestamptz created_at
    }
```

## Relationships

| From | To | Cardinality | FK column | Notes |
|------|----|-------------|-----------|-------|
| `users` | `landlord_verifications` | 1 : 0..1 | `user_id` | One verification record per landlord |
| `users` | `landlord_verifications` | 0..* : 0..1 | `verified_by` | Admin who approved/rejected; `ON DELETE SET NULL` |
| `users` | `properties` | 1 : 0..* | `landlord_id` | Landlord owns listings |
| `users` | `applications` | 1 : 0..* | `tenant_id` | Tenant submits applications |
| `users` | `reviews` | 1 : 0..* | `reviewer_id` | User writes reviews |
| `users` | `reviews` | 1 : 0..* | `reviewee_id` | User receives reviews |
| `users` | `conversations` | 1 : 0..* | `tenant_id` | Tenant participates in chat |
| `users` | `conversations` | 1 : 0..* | `landlord_id` | Landlord participates in chat |
| `users` | `messages` | 1 : 0..* | `sender_id` | User sends messages |
| `properties` | `property_images` | 1 : 0..* | `property_id` | At most one cover image per property |
| `properties` | `property_amenities` | 1 : 0..* | `property_id` | M:N with `amenities` |
| `amenities` | `property_amenities` | 1 : 0..* | `amenity_id` | M:N with `properties` |
| `properties` | `applications` | 1 : 0..* | `property_id` | Property receives applications |
| `properties` | `reviews` | 1 : 0..* | `property_id` | Reviews scoped to a rental |
| `properties` | `conversations` | 1 : 0..* | `property_id` | Chat scoped to a listing |
| `conversations` | `messages` | 1 : 0..* | `conversation_id` | Thread contains messages |

## Partial unique indexes

| Index | Table | Rule |
|-------|-------|------|
| `property_images_one_cover_per_property` | `property_images` | Only one `is_cover = true` row per `property_id` |
| `applications_one_pending_per_tenant_property` | `applications` | Only one `PENDING` row per `(property_id, tenant_id)` |

## Composite unique constraints

| Index | Table | Columns |
|-------|-------|---------|
| `property_amenities_property_id_amenity_id_unique` | `property_amenities` | `(property_id, amenity_id)` |
| `reviews_reviewer_reviewee_property_target_unique` | `reviews` | `(reviewer_id, reviewee_id, property_id, target_type)` |
| `conversations_property_tenant_landlord_unique` | `conversations` | `(property_id, tenant_id, landlord_id)` |
