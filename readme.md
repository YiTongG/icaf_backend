**Inplemented and test:**
| Method | Endpoint                   | Description                                                     |
| ------ | -------------------------- | --------------------------------------------------------------- |
| GET    | `/api/artworks/:artworkSk` | Retrieve a single artwork by its `artworkSk`                    |
| GET    | `/api/artworks`            | Retrieve all artworks; supports query `?is_approved=true/false` |
| POST   | `/api/artworks`            | Create a new artwork (with validation)                          |
| PATCH  | `/api/artworks/:artworkSk` | Approve or update approval status for an artwork                |
| DELETE | `/api/artworks/:artworkSk` | Delete a specific artwork                                       |


| Method | Endpoint               | Description                                                              |
| ------ | ---------------------- | ------------------------------------------------------------------------ |
| PATCH  | `/api/vote/:artworkSk` | Cast or update a vote for a specific artwork (includes `userSk` in body) |
| GET    | `/api/votes`           | Get the total number of votes across all artworks                        |
**TODO:user Authentication and Management**