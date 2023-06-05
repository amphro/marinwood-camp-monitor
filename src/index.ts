import express from 'express';
import { CampInformation, getCampCache, retrieveMiwokInformationByWeek, setCampCache } from './camp';
import { log, logCache } from './log';
import { MessageType, sendMessage } from './twilio';

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

app.get('/', (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  const data = Object.values(entriesCache).map(week => ({name: week.name, openings: week.openings})).sort();
  res.send(jsonToHtml(data));
});

app.get('/logs', (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  res.send(jsonToHtml(logCache));
});

app.get('/report', async (req, res) => {
  await retrieveAndReportWeeks();

  const data = Object.values(entriesCache).map(week => ({name: week.name, openings: week.openings})).sort();
  // res.setHeader('Content-Type', 'application/json');
  res.send(jsonToHtml(data));
});

app.listen(port, () => {
  log(`Example app listening on port ${port}`)
});



const POLLING_INTERVAL = (process.env.POLLING_INTERVAL && !isNaN(parseInt(process.env.POLLING_INTERVAL)) && parseInt(process.env.POLLING_INTERVAL)) || 1000 * 60 * 5; // every 5 minutes



async function retrieveAndReportWeeks() {
  const miwokWeeks = await retrieveMiwokInformationByWeek();

  log(miwokWeeks.map(entry => entry.name + " has " + entry.openings + " openings").join('\n'));

  const entriesCache = await getCampCache();
  if (Object.values(entriesCache).length === 0) {
    sendMessage(`Initiating weeks.`, MessageType.ADMIN);
  }

  const differences = [];
  for (const week of miwokWeeks) {
    const key = week.name;
    
    /// Only report differences if we have already seen the information before
    if (entriesCache[key]) {
      const oldOpenings = entriesCache[key].openings;
      const newOpenings = week.openings;
      if (oldOpenings !== newOpenings) {
        let message = `Availability for ${week.name} changed from ${oldOpenings} to ${newOpenings}.`
        if (newOpenings > 0) {
          message += ` Click to register: ${week.detail_url}`;
        }
        differences.push(message);
      }
    } 
    // Update cache with new information
    entriesCache[key] = week;
  }
  if (differences.length > 0) {
    sendMessage(`Changes detected:\n${differences.join('\n')}`)
  }
  setCampCache(entriesCache)
}

//log(`Starting polling at ${POLLING_INTERVAL} interval`);
//setInterval(retrieveAndReportWeeks, POLLING_INTERVAL);


