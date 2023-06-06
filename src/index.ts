import express from 'express';
import { retrieveMiwokInformationByWeek } from './camp';
import { getCampCache, setCampCache } from './db';
import { log, logCache } from './log';
import { MessageType, sendMessage } from './twilio';
import { CampWeekMap } from './types';

const app = express();
const port = process.env.PORT || 3000;

function jsonToHtml(json: any) {
  if (Array.isArray(json)) {
    return stringToHtml(json.map(j => typeof j === 'string' ? j : JSON.stringify(j)).join('\n'))
  }
  return stringToHtml(JSON.stringify(json));
}

function stringToHtml(msg: string) {
  return msg.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
}

app.get('/', async (req, res) => {
  const entriesCache = await getCampCache();
  // res.setHeader('Content-Type', 'application/json');
  const data = Object.values(entriesCache).map(week => ({name: week.name, openings: week.openings})).sort();
  res.send(jsonToHtml(data));
});

app.get('/logs', async(req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  res.send(jsonToHtml(logCache));
});

app.get('/report', async (req, res) => {
  const updatedEntriesCache = await retrieveAndReportWeeks();

  const data = Object.values(updatedEntriesCache).map(week => ({name: week.name, openings: week.openings})).sort();
  // res.setHeader('Content-Type', 'application/json');
  res.send(jsonToHtml(data));
});

app.listen(port, () => {
  log(`Example app listening on port ${port}`)
});

const weeksToIgnore = [
  "Camp Miwok #9"
]

async function retrieveAndReportWeeks(): Promise<CampWeekMap> {
  const miwokWeeks = await retrieveMiwokInformationByWeek();

  log('\n' + miwokWeeks.map(entry => entry.name + " has " + entry.openings + " openings").join('\n'));

  const entriesCache = await getCampCache();
  if (Object.values(entriesCache).length === 0) {
    await sendMessage(`Initiating weeks.`, MessageType.ADMIN);
  }

  const differences = [];
  for (const week of miwokWeeks) {
    const key = week.name;
    
    /// Only report differences if we have already seen the information before
    if (entriesCache[key]) {
      const oldOpenings = entriesCache[key].openings;
      const newOpenings = week.openings;
      if (oldOpenings !== newOpenings) {
        let message = '';
        
        if (newOpenings >= 1 && oldOpenings === 0) {
          message = `${week.name} now has ${newOpenings} spot${newOpenings === 1 ? '' : 's'} open! Click to register: ${week.detail_url}`;
          // Right now, only want when a spot becomes available, so just added it here
          differences.push(message);
        } else if (newOpenings === 0) {
          message = `All spots were taken for ${week.name}`;
        } else if (newOpenings < oldOpenings) {
          message = `A spot in ${week.name} was taken.`;
        } else if (oldOpenings < newOpenings) {
          message = `Another spot opened for ${week.name}`;
        }
        
        if (weeksToIgnore.includes(key)) {
          log(`Ignoring: ${message}`);
        } else if (message) {
          log(message);
          // Only want new, so just moved this above.
          // differences.push(message);
        } else {
          log(`no message??? ${week.name} - oldOpening: ${oldOpenings} - newOpening: ${newOpenings}`);
        }
      }
    } 
    // Update cache with new information
    entriesCache[key] = week;
  }
  if (differences.length > 0) {
    await sendMessage(`${differences.join('\n')}`)
  }
  setCampCache(entriesCache)
  return entriesCache
}

//log(`Starting polling at ${POLLING_INTERVAL} interval`);
//setInterval(retrieveAndReportWeeks, POLLING_INTERVAL);


