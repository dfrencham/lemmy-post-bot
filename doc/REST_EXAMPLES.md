# Rest Example #

If you need to get values, such as CommunityID, you can do it with a REST client.

Thunder for VSCode is one such example.

This URL will return JSON including a CommunityID:

`https://{lemmy instance}/api/v3/post/list?community_name={community name}&limit=2&page=1`