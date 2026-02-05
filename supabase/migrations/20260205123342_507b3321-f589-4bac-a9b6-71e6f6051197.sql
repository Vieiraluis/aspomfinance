-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for viewing logos (public)
CREATE POLICY "Logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

-- Create policy for uploading logos (authenticated users to their folder)
CREATE POLICY "Users can upload their own logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for updating logos
CREATE POLICY "Users can update their own logo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for deleting logos
CREATE POLICY "Users can delete their own logo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);