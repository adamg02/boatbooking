delete from boatbooking."Booking" where "startTime"='2027-01-01T08:00:00Z';
delete from tt.time_records where recorded_by='90000000-0000-0000-0000-000000000099' and crew_id='44444444-4444-4444-4444-444444444442';
update tt.user_profiles set role=null where email='erin@x.com';
delete from tt.user_profiles where email='bob@x.com';
update boatbooking."Club" set "subscriptionTier"='free', description=null;
update boatbooking."User" set "isActive"=true;
