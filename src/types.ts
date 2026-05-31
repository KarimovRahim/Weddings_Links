export interface Guest {
  id: string; // Unique slug for the url
  eventId: string; // ID of the wedding setting it links to
  name: string; // Display name on the invite
  greetingType: 'Дорогой' | 'Дорогая' | 'Дорогие' | string;
  customMessage: string;
  status: 'pending' | 'accepted' | 'declined';
  dietaryRestrictions?: string;
  isAdminGenerated?: boolean;
}

export interface WeddingSettings {
  id: string;
  name: string; // Category name
  groomName: string;
  brideName: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  venueMapLink?: string;
  accentColor: string;
  // Dynamic fields for more personalization
  bridePhone?: string;
  dressCodeText?: string;
  wishesText?: string;
}

