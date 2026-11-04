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
select pg_temp.mkuser('a0000000-0000-0000-0000-00000000000a','alice@x.com','google','g-alice','Alice');
select pg_temp.mkuser('b0000000-0000-0000-0000-00000000000b','bob@x.com','google','g-bob','Bob');
select pg_temp.mkuser('c0000000-0000-0000-0000-00000000000c','carol@x.com','google','g-carol','Carol');
select pg_temp.mkuser('d0000000-0000-0000-0000-0000000000bb','dave@x.com','google','g-dave','Dave');
select pg_temp.mkuser('e0000000-0000-0000-0000-0000000000bb','Erin@X.com','azure','az-erin-bb','Erin');
insert into "Club"(id,name,"joinCode","stripeCustomerId") values ('clubA','Club A','AAAA1111','cus_A'),('clubB','Club B','BBBB2222','cus_B');
update "User" set "clubId"='clubA' where email in ('alice@x.com','bob@x.com','dave@x.com','Erin@X.com');
update "User" set "clubId"='clubB' where email='carol@x.com';
insert into "Group"(id,name,"clubId") values ('gA','Admin','clubA'),('gAm','Members','clubA'),('gB','Admin','clubB');
insert into "UserGroup" values ('a0000000-0000-0000-0000-00000000000a','gA'),('b0000000-0000-0000-0000-00000000000b','gAm'),('c0000000-0000-0000-0000-00000000000c','gB');
insert into "Boat"(id,name,"clubId",capacity) values ('boatA1','A1','clubA',1),('boatA2','A2','clubA',2),('boatB1','B1','clubB',1);
update "Boat" set "isActive"=false where id='boatA2';
insert into "BoatGroup" values ('boatA1','gAm');
insert into "Booking"(id,"userId","boatId","startTime","endTime") values ('bkA','b0000000-0000-0000-0000-00000000000b','boatA1',now()+interval '1 day',now()+interval '1 day 1 hour'),('bkB','c0000000-0000-0000-0000-00000000000c','boatB1',now()+interval '1 day',now()+interval '1 day 1 hour');
insert into "Payment"("clubId",amount,status) values ('clubA',1299,'succeeded'),('clubB',1299,'succeeded');
insert into "LoginEvent"("userId") values ('a0000000-0000-0000-0000-00000000000a');
insert into "ManagementIpAllowlist"(ip) values ('1.2.3.4');
