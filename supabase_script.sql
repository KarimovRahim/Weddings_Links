-- SQL Script for Supabase setup

-- Creating Settings table
CREATE TABLE public.settings (
    id text NOT NULL,
    name text,
    "groomName" text,
    "brideName" text,
    date text,
    time text,
    "venueName" text,
    "venueAddress" text,
    "venueMapLink" text,
    "accentColor" text,
    "dressCodeText" text,
    "wishesText" text,
    CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Creating Guests table
CREATE TABLE public.guests (
    id text NOT NULL,
    "eventId" text,
    name text,
    "greetingType" text,
    "customMessage" text,
    status text,
    "dietaryRestrictions" text,
    "isAdminGenerated" boolean DEFAULT true,
    CONSTRAINT guests_pkey PRIMARY KEY (id),
    CONSTRAINT fk_event FOREIGN KEY ("eventId") REFERENCES public.settings(id) ON DELETE CASCADE
);

-- Row Level Security policies
-- For public accessibility so your guests can read and reply to their invites without Authentication

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable Read Access All" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable Insert All" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update All" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Enable Delete All" ON public.settings FOR DELETE USING (true);

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable Read Access All" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Enable Insert All" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update All" ON public.guests FOR UPDATE USING (true);
CREATE POLICY "Enable Delete All" ON public.guests FOR DELETE USING (true);
