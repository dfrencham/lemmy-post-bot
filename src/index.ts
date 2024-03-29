import { LemmyHttp, Login, CreatePost, PostView, FeaturePost, GetPosts } from 'lemmy-js-client';
import { Settings } from './settings.interface';
import fs from 'fs';

async function runBot(mode: string) {

  switch (mode) {
    case "-d": // daily post
    case "-t": // connection test
      break;
    default: // print version/about
      mode = "-v"  ;
      break;
  }

  if (mode === "-v") {
    console.log(`Please use one of the following parameters:`);
    console.log('   -t   Run a connection test only');
    console.log('   -d   Do daily post based on settings.json file');
    return;
  }

  var config: Settings;
  let confResult  = getConfig();
  if (confResult)
    config = confResult;
  else
    return;

  let loginResult = await doLogin(config);
  if (!loginResult)
    return; // exit, no creds

  console.log(`Log in successful`);

  if (mode === "-t")
    return; // connection test only

  if (mode === "-d")
    doDailyPost(config, loginResult);
}

/**
 * Retrieves config
 * @returns Settings blob
 */
function getConfig(): Settings | null {
  var config: Settings = ({} as Settings);
  try {
    var data = fs.readFileSync(`${__dirname}/settings.json`, 'utf8');
    data = JSON.parse(data);
    config = ((data as unknown) as Settings);
  } catch (error) {
    console.log('No settings found. Do you need to create settings.json?');
    return null;
  }
  return config;
}

/**
 * Log into Lemmy
 * @param    Config blob
 * @returns  Authentication string, or null if fail
 */
async function doLogin(config: Settings): Promise<string | null> {
  try {
    let loginForm: Login = {
      username_or_email: config.botUser,
      password: config.botPassword,
    };
    let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);
    let authString = (await client.login(loginForm))?.jwt;
    return authString ? authString : null;
  } catch (error) {
    console.log(`Log in error: ${error}`);
    return null;
  }
}

async function doDailyPost(config: Settings, authString: string): Promise<number> {
 // Post title/ date string can be set here
 let postTitleDaily = "Daily Discussion Thread";
 let postTitle = `${postTitleDaily} - ${(new Date()).toDateString()}`;
 console.log(`Using post title: ${postTitle}`);

 let newPost = await doLemmyPost(config, authString, postTitle, true);
 
 // unfeature posts except for our new post
 let featuredPosts = await getLemmyCommunityPostIDs(config, authString, postTitleDaily, true);
 featuredPosts.filter((v) => ((v != newPost) || !newPost)).forEach(async (fp) => {
   await doLemmyPostUnfeature(config, authString, fp);
 });

 // tag a specific post
 //await doLemmyPostFeature(config, authString, 259388);

 return newPost;
}


/**
 * Create a Lemmy post
 * @param config      Config blob
 * @param authString  Authentication string
 * @param postTitle   Title of new post
 * @param featured    Feature/sticky the new post true/false
 */
async function doLemmyPost(config: Settings, authString: string, postTitle: string, featured: boolean): Promise<number> {
  
  let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);
  client.setHeaders({
    Authorization: `Bearer ${authString}`
  });

  let cp: CreatePost = {
    community_id: config.communityId,
    name: postTitle,
  }

  var postResponse: PostView | null = null;
  try {
    let cpReponse = (await client.createPost(cp)).post_view;
    postResponse = cpReponse || undefined;
    console.log("Post successful");
    console.log(postResponse);
  } catch (error) {
    console.log(`Post failed: ${error}`);
  }

  if (featured && postResponse) {
    await doLemmyPostFeature(config, authString, postResponse.post.id);
  }

  return postResponse?.post?.id || 0;
}

/**
 * Set a lemmy post as Featured
 * Note: requires mod rights
 * @param config      Config blob
 * @param authString  Authentication string
 * @param postId      Post Id       
 * @returns success/fail boolean
 */
async function doLemmyPostFeature(config: Settings, authString: string, postId: number): Promise<boolean> {
  let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);
  client.setHeaders({
    Authorization: `Bearer ${authString}`
  });

  let fp: FeaturePost = {
    post_id: postId,
    featured: true,
    feature_type: 'Community'
  }
  
  try {
    let featureResponse = (await client.featurePost(fp)).post_view;
    if (featureResponse) {
      console.log('Post has been featured');
    }
    return true;
  } catch (error) {
    console.log(`Setting post featured failed: ${error}`);
    return false;
  }
}

/**
 * Unset a lemmy post as Featured
 * Note: requires mod rights
 * @param config      Config blob
 * @param authString  Authentication string
 * @param postId      Post Id       
 * @returns success/fail boolean
 */
async function doLemmyPostUnfeature(config: Settings, authString: string, postId: number): Promise<boolean> {
  let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);
  client.setHeaders({
    Authorization: `Bearer ${authString}`
  });

  let fp: FeaturePost = {
    post_id: postId,
    featured: false,
    feature_type: 'Community'
  }
  
  try {
    let unfeatureResponse = (await client.featurePost(fp)).post_view;
    if (unfeatureResponse) {
      console.log(`Post ${postId} has been unfeatured`);
    }
    return true;
  } catch (error) {
    console.log(`Setting post unfeatured failed: ${error}`);
    return false;
  }
}

/**
 * Get post Ids for community posts
 * @param config      Config blob
 * @param authString  Authentication string
 * @param filter      Only inlude posts with a title beginning with this string
 * @param featured    Only include featured posts
 * @returns           Array of post Ids
 */
async function getLemmyCommunityPostIDs(config: Settings, authString: string, filter: string, featured: boolean): Promise<Array<number>> {
  let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);
  client.setHeaders({
    Authorization: `Bearer ${authString}`
  });

  let gp: GetPosts = {
    community_id: config.communityId,
    sort: "Active"
  };

  let result: Array<number> = [];

  try {
    let gpResponse = (await client.getPosts(gp)).posts;
    gpResponse.forEach((p) => {
      if ((filter && p.post.name.startsWith(filter)) &&
          (!featured || (featured && p.post.featured_community))) {
        console.log(`${p.post.name}`);
        result.push(p.post.id);
      }
    });
  } catch (error) {
    console.log(error);
  }
 
  return result;
}

let argv = process.argv.slice(2);

runBot(argv.length ? argv[argv.length-1] : "");