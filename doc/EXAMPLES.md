# Lemmy HTTP client examples #

Example Code for Lemmy HTTP client

Get posts for a community.

```ts
  let gp: GetPosts = {
     auth: jwt,
     community_id: communityId,
  };
  
  let gpResponse = (await client.getPosts(gp)).posts;
  console.log(gpResponse);
```

Get details for a community.

```ts
  let gc: GetCommunity = {
    auth: jwt,
    id: communityId
  }
  let gcResponse = (await client.getCommunity(gc)).community_view;
  console.log(gcResponse);
```
