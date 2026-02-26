# Veterinary Community Module

## Overview

The Community Module is a professional networking and knowledge-sharing platform for veterinarians, similar to LinkedIn + Reddit but focused on veterinary medicine.

## Features

### Post Types

1. **CLINICAL_CASE**: Real patient cases with symptoms, diagnosis, treatment, and evolution
2. **FORUM_DISCUSSION**: Questions and discussions between veterinarians
3. **ARTICLE**: Educational or informative content

### Visibility Levels

- **PUBLIC**: Visible to all users (pet owners and veterinarians)
- **VETS_ONLY**: Only visible to verified veterinarians

### Core Features

- ✅ Create posts (veterinarians only)
- ✅ Like posts
- ✅ Save posts (favorites)
- ✅ Comment system with nested replies
- ✅ Follow veterinarian profiles
- ✅ Report inappropriate content
- ✅ Reputation system for veterinarians
- ✅ Pagination and filtering
- ✅ Search functionality

## Database Schema

### Models

- `CommunityPost`: Main post model
- `ClinicalCaseDetails`: Details for clinical case posts
- `ForumDetails`: Details for forum discussion posts
- `ArticleDetails`: Details for article posts
- `Comment`: Comments with nested replies support
- `PostLike`: Like tracking
- `PostFavorite`: Favorite tracking
- `Follow`: Veterinarian following system
- `Report`: Content reporting system
- `VeterinarianReputation`: Reputation points tracking

## API Endpoints

### Posts

- `POST /community/posts` - Create a new post (VET only)
- `GET /community/posts` - List posts with pagination and filters
- `GET /community/posts/:id` - Get post details

### Interactions

- `POST /community/posts/:id/comment` - Add a comment (VET only)
- `POST /community/posts/:id/like` - Toggle like
- `POST /community/posts/:id/favorite` - Toggle favorite
- `POST /community/comments/:id/helpful` - Mark comment as helpful

### Social

- `POST /community/follow/:vetId` - Follow/unfollow a veterinarian (VET only)

### Moderation

- `POST /community/posts/:id/report` - Report a post

## Authorization Rules

1. **Create Posts**: Only verified veterinarians (`VET` role with `VERIFIED` status)
2. **View Posts**: 
   - `PUBLIC` posts: All authenticated users
   - `VETS_ONLY` posts: Only verified veterinarians
3. **Comment**: Only verified veterinarians
4. **Like/Favorite**: All authenticated users
5. **Follow**: Only verified veterinarians

## Legal Requirements

Clinical cases must include `declaresNoPersonalData: true` to ensure no personal owner data is stored.

## Reputation System

Veterinarians earn reputation points:

- **+20 points**: Publishing a clinical case
- **+5 points**: Answering a forum discussion (via comment)
- **+15 points**: When a comment is marked as helpful

## Query Parameters

### GET /community/posts

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `type`: Filter by post type (`CLINICAL_CASE`, `FORUM_DISCUSSION`, `ARTICLE`)
- `visibility`: Filter by visibility (`PUBLIC`, `VETS_ONLY`)
- `tags`: Array of tags to filter by
- `search`: Search term for title

## Example Requests

### Create Clinical Case

```json
POST /community/posts
{
  "type": "CLINICAL_CASE",
  "title": "Canine Parvovirus Case",
  "visibility": "VETS_ONLY",
  "declaresNoPersonalData": true,
  "tags": ["emergency", "infectious-disease"],
  "species": "DOG",
  "age": "8 months",
  "weight": 12.5,
  "symptoms": "Vomiting, diarrhea, lethargy",
  "diagnosis": "Parvovirus confirmed via ELISA test",
  "treatment": "IV fluids, antibiotics, supportive care",
  "evolution": "Recovered after 5 days",
  "images": ["https://example.com/image1.jpg"]
}
```

### Create Forum Discussion

```json
POST /community/posts
{
  "type": "FORUM_DISCUSSION",
  "title": "Best approach for feline diabetes?",
  "visibility": "VETS_ONLY",
  "tags": ["internal-medicine", "feline"],
  "description": "I have a 12-year-old cat with newly diagnosed diabetes..."
}
```

### Create Article

```json
POST /community/posts
{
  "type": "ARTICLE",
  "title": "Understanding Feline Behavior",
  "visibility": "PUBLIC",
  "tags": ["behavior", "feline"],
  "content": "<p>Rich text content here...</p>",
  "coverImage": "https://example.com/cover.jpg"
}
```

## Migration

After adding the schema, run:

```bash
npx prisma migrate dev --name add_community_module
```

## Testing

All endpoints require JWT authentication. Use the existing auth system to get tokens.
