import CyclicDB from '@cyclic.sh/dynamodb'
import { CampInformation, CampWeekMap } from './types'

const db = CyclicDB('scarlet-foal-wearCyclicDB')

export const setCampCache = async function(data: CampWeekMap) {
  const camp = db.collection('camp')
  const weeks = Object.values(data).map(week => ({
    name: week.name,
    detail_url: week.detail_url,
    openings: week.openings
  }))
  await camp.set('miwok', {weeks});
}

export async function getCampCache(): Promise<CampWeekMap> {
    let camp = db.collection('camp')

    let data = await camp.get('miwok');
    let weeks: CampWeekMap = {};

    data.props && data.props.weeks && data.props.weeks.forEach((week: CampInformation) => {weeks[week.name] = week});

    return weeks;
}

export async function clearCampCache(): Promise<CampWeekMap> {
  let camp = db.collection('camp')

  return await camp.delete('miwok')
}

export async function updateCampCache(data: CampInformation[]) {
  const map: CampWeekMap = {}

  data.forEach((item) => {map[item.name] = item});
  await setCampCache(map);
}