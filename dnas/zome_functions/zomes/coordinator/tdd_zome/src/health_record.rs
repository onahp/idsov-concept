use hdk::prelude::*;
use tdd_zome_integrity::*;
#[hdk_extern]
pub fn create_health_record(health_record: HealthRecord) -> ExternResult<Record> {
    let health_record_hash = create_entry(
        &EntryTypes::HealthRecord(health_record.clone()),
    )?;
    let record = get(health_record_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created HealthRecord"))
            ),
        )?;
    let path = Path::from("all_health_records");
    create_link(
        path.path_entry_hash()?,
        health_record_hash.clone(),
        LinkTypes::AllHealthRecords,
        (),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_latest_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let links = get_links(
        original_health_record_hash.clone(),
        LinkTypes::HealthRecordUpdates,
        None,
    )?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_health_record_hash = match latest_link {
        Some(link) => {
            link.target
                .clone()
                .into_action_hash()
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("No action hash associated with link"))
                    ),
                )?
        }
        None => original_health_record_hash.clone(),
    };
    get(latest_health_record_hash, GetOptions::default())
}
#[hdk_extern]
pub fn get_original_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    let Some(details) = get_details(original_health_record_hash, GetOptions::default())?
    else {
        return Ok(None);
    };
    match details {
        Details::Record(details) => Ok(Some(details.record)),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }
}
#[hdk_extern]
pub fn get_all_revisions_for_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<Vec<Record>> {
    let Some(original_record) = get_original_health_record(
        original_health_record_hash.clone(),
    )? else {
        return Ok(vec![]);
    };
    let links = get_links(
        original_health_record_hash.clone(),
        LinkTypes::HealthRecordUpdates,
        None,
    )?;
    let get_input: Vec<GetInput> = links
        .into_iter()
        .map(|link| Ok(
            GetInput::new(
                link
                    .target
                    .into_action_hash()
                    .ok_or(
                        wasm_error!(
                            WasmErrorInner::Guest(String::from("No action hash associated with link"))
                        ),
                    )?
                    .into(),
                GetOptions::default(),
            ),
        ))
        .collect::<ExternResult<Vec<GetInput>>>()?;
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let mut records: Vec<Record> = records.into_iter().filter_map(|r| r).collect();
    records.insert(0, original_record);
    Ok(records)
}
#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateHealthRecordInput {
    pub original_health_record_hash: ActionHash,
    pub previous_health_record_hash: ActionHash,
    pub updated_health_record: HealthRecord,
}
#[hdk_extern]
pub fn update_health_record(input: UpdateHealthRecordInput) -> ExternResult<Record> {
    let updated_health_record_hash = update_entry(
        input.previous_health_record_hash.clone(),
        &input.updated_health_record,
    )?;
    create_link(
        input.original_health_record_hash.clone(),
        updated_health_record_hash.clone(),
        LinkTypes::HealthRecordUpdates,
        (),
    )?;
    let record = get(updated_health_record_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly updated HealthRecord"))
            ),
        )?;
    Ok(record)
}
#[hdk_extern]
pub fn delete_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<ActionHash> {
    let details = get_details(
            original_health_record_hash.clone(),
            GetOptions::default(),
        )?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("{pascal_entry_def_name} not found"))
            ),
        )?;
    let record = match details {
        Details::Record(details) => Ok(details.record),
        _ => {
            Err(
                wasm_error!(
                    WasmErrorInner::Guest(String::from("Malformed get details response"))
                ),
            )
        }
    }?;
    let path = Path::from("all_health_records");
    let links = get_links(path.path_entry_hash()?, LinkTypes::AllHealthRecords, None)?;
    for link in links {
        if let Some(hash) = link.target.into_action_hash() {
            if hash.eq(&original_health_record_hash) {
                delete_link(link.create_link_hash)?;
            }
        }
    }
    delete_entry(original_health_record_hash)
}
#[hdk_extern]
pub fn get_all_deletes_for_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<Option<Vec<SignedActionHashed>>> {
    let Some(details) = get_details(original_health_record_hash, GetOptions::default())?
    else {
        return Ok(None);
    };
    match details {
        Details::Entry(_) => {
            Err(wasm_error!(WasmErrorInner::Guest("Malformed details".into())))
        }
        Details::Record(record_details) => Ok(Some(record_details.deletes)),
    }
}
#[hdk_extern]
pub fn get_oldest_delete_for_health_record(
    original_health_record_hash: ActionHash,
) -> ExternResult<Option<SignedActionHashed>> {
    let Some(mut deletes) = get_all_deletes_for_health_record(
        original_health_record_hash,
    )? else {
        return Ok(None);
    };
    deletes
        .sort_by(|delete_a, delete_b| {
            delete_a.action().timestamp().cmp(&delete_b.action().timestamp())
        });
    Ok(deletes.first().cloned())
}
