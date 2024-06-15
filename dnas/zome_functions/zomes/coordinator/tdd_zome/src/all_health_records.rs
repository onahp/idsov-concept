use hdk::prelude::*;
use tdd_zome_integrity::*;

#[hdk_extern]
pub fn get_all_health_records(_: ()) -> ExternResult<Vec<Link>> {
    let path = Path::from("all_health_records");
    get_links(path.path_entry_hash()?, LinkTypes::AllHealthRecords, None)
}
