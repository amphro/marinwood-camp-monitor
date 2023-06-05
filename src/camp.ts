import axios from "axios"; 
import {readFileSync,writeFileSync} from "fs";
import { log } from "./log";
import { MessageType, sendMessage } from "./twilio";

const ACTIVITIES_ENDPOINT = "https://anc.apm.activecommunities.com/marinwood/rest/activities/list?locale=en-US";
const CACHE_PAGE_PATH = "./cache/camp.json";
const CACHE_PAGE = false;
const RETRIEVE_CACHED_PAGE = false

const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB('scarlet-foal-wearCyclicDB')

export type CampInformation = {
  name: string;
  openings: number;
  detail_url: string;
}

export type CampWeekMap = { [key: string]: CampInformation }

export const setCampCache = async function(data: CampWeekMap) {
  let camp = db.collection('camp')

  await camp.set('miwok', data)
}

export async function getCampCache(): Promise<CampWeekMap> {
    let camp = db.collection('camp')

    return await camp.get('miwok')
}

export async function retrieveMiwokInformationByWeek(): Promise<CampInformation[]> {
  let data: CampInformation[];
  if (RETRIEVE_CACHED_PAGE) {
    log(`Reading cache page ${CACHE_PAGE_PATH}`);
    data = JSON.parse(readFileSync(CACHE_PAGE_PATH, 'utf8'));;
  } else {
    const response = await axios.post(ACTIVITIES_ENDPOINT, getActivityPostData());

    if (response.status !== 200) {
      sendMessage(response.statusText + " " + response.data, MessageType.ADMIN);
      log(`${response.status} - ${response.status} - ${JSON.stringify(response.data)}`);
    }
    data = response.data.body.activity_items;
  }
  
  if (CACHE_PAGE) {
    log(`Writing cache page ${CACHE_PAGE_PATH}`);
    writeFileSync(CACHE_PAGE_PATH, JSON.stringify(data), 'utf8');
  }
  return data
}

function getActivityPostData() {
  return {
    "activity_search_pattern":{
      "skills":[],"time_after_str":"","days_of_week":null,"activity_select_param":2,"center_ids":[],"time_before_str":"","open_spots":null,"activity_id":null,"activity_category_ids":["6"],"date_before":"","min_age":3,"date_after":"","activity_type_ids":[],"site_ids":[],"for_map":false,"geographic_area_ids":[],"season_ids":[],"activity_department_ids":[],"activity_other_category_ids":[],"child_season_ids":[],"activity_keyword":"miwok","instructor_ids":[],"max_age":5,"custom_price_from":"","custom_price_to":""},"activity_transfer_pattern":{}}
}