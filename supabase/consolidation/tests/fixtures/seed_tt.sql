create extension if not exists pgcrypto with schema extensions;
create or replace function pg_temp.mkuser(p_id uuid, p_email text, p_provider text, p_pid text, p_name text) returns void language plpgsql as $$
begin
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
     confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000',p_id,'authenticated','authenticated',p_email, extensions.crypt('Passw0rd!', extensions.gen_salt('bf')), now(),
     jsonb_build_object('provider',p_provider,'providers',jsonb_build_array(p_provider)), jsonb_build_object('full_name',p_name), now(), now(),'','','','','','','','');
  insert into auth.identities (id,user_id,provider,provider_id,identity_data,created_at,updated_at,last_sign_in_at)
  values (gen_random_uuid(),p_id,p_provider,p_pid,jsonb_build_object('sub',p_pid,'email',p_email,'email_verified',true),now(),now(),now());
end $$;
select pg_temp.mkuser('f0000000-0000-0000-0000-0000000000ff','frank@x.com','google','g-frank','Frank');
select pg_temp.mkuser('d0000000-0000-0000-0000-0000000000ee','dave@x.com','google','g-dave','Dave');
select pg_temp.mkuser('e0000000-0000-0000-0000-0000000000ee','erin@x.com','azure','az-erin-tt','Erin');
select pg_temp.mkuser('90000000-0000-0000-0000-000000000099','grace@x.com','facebook','fb-grace','Grace');
update user_profiles set role='admin' where email='frank@x.com';
update user_profiles set role='timer' where email in ('dave@x.com','grace@x.com');
insert into competitions(id,name,date,created_by) values ('11111111-1111-1111-1111-111111111111','Head 2026','2026-11-01','f0000000-0000-0000-0000-0000000000ff'),('22222222-2222-2222-2222-222222222222','Head 2026 B','2026-11-01','f0000000-0000-0000-0000-0000000000ff');
insert into competition_links(competition_a_id,competition_b_id) values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
insert into timing_points(id,competition_id,name,order_index,assigned_user_id) values ('33333333-3333-3333-3333-333333333331','11111111-1111-1111-1111-111111111111','Start',1,'d0000000-0000-0000-0000-0000000000ee'),('33333333-3333-3333-3333-333333333332','11111111-1111-1111-1111-111111111111','Finish',2,'90000000-0000-0000-0000-000000000099');
insert into crews(id,competition_id,name,category,crew_number) values ('44444444-4444-4444-4444-444444444441','11111111-1111-1111-1111-111111111111','Staines A','8+',1),('44444444-4444-4444-4444-444444444442','11111111-1111-1111-1111-111111111111','Staines B','4x',2);
insert into time_records(crew_id,timing_point_id,"timestamp",recorded_by) values ('44444444-4444-4444-4444-444444444441','33333333-3333-3333-3333-333333333331',now(),'d0000000-0000-0000-0000-0000000000ee'),('44444444-4444-4444-4444-444444444441','33333333-3333-3333-3333-333333333332',now()+interval '15 min','90000000-0000-0000-0000-000000000099'),('44444444-4444-4444-4444-444444444442','33333333-3333-3333-3333-333333333331',now(),'f0000000-0000-0000-0000-0000000000ff');
