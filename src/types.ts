export type CampInformation = {
  name: string;
  openings: number;
  detail_url: string;
}

export type CampWeekMap = { [key: string]: CampInformation }