-- Snapshot of template title at completion (still visible if template is deleted or template_id cleared).
alter table public.trainings
  add column if not exists template_name text;
