import { LemmyHttp, Login, CreatePost, PostView, FeaturePost } from 'lemmy-js-client';
import { Settings } from './settings.interface';

async function runBot() {
  var config: Settings = ({} as Settings);
  try {
    config = require('./settings.json');
  } catch (error) {
    console.log('No settings found. Do you need to create settings.json?');
  }
  
  // Post title/ date string can be set here
  let postTitle = `Daily Discussion Thread - ${(new Date()).toDateString()}`;
  console.log(`Using post title: ${postTitle}`);

  let loginResult = await doLogin(config);
  if (!loginResult)
    return; // exit, no creds

  console.log(`Log in successful`);

  let authString = loginResult;
  await doLemmyPost(config, authString, postTitle, true);
  
  // tag a specific post
  //await doLemmyPostFeature(config, authString, 259388);
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

/**
 * Create a Lemmy post
 * @param config      Config blob
 * @param authString  Authentication string
 * @param postTitle   Title of new post
 * @param featured    Feature/sticky the new post true/false
 */
async function doLemmyPost(config: Settings, authString: string, postTitle: string, featured: boolean) {
  
  let client: LemmyHttp = new LemmyHttp(config.baseURL, undefined);

  let cp: CreatePost = {
    auth: authString,
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
    await doLemmyPostFeature(config, authString, postResponse.post.id)
  }
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

  let fp: FeaturePost = {
    post_id: postId,
    featured: false,
    feature_type: 'Local',
    auth: authString
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

runBot();