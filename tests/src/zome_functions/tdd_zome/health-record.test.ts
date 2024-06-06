import { assert, test } from "vitest";

import { runScenario, dhtSync, CallableCell } from '@holochain/tryorama';
import {
  NewEntryAction,
  ActionHash,
  Record,
  Link,
  CreateLink,
  DeleteLink,
  SignedActionHashed,
  AppBundleSource,
  fakeActionHash,
  fakeAgentPubKey,
  fakeEntryHash
} from '@holochain/client';
import { decode } from '@msgpack/msgpack';

import { createHealthRecord, sampleHealthRecord } from './common.js';

test('create HealthRecord', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/idsov-hApp-concept.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a HealthRecord
    const aliceRecord: Record = await createHealthRecord(alice.cells[0]);
    const bobRecord: Record = await createHealthRecord(bob.cells[0]);
    assert.ok(aliceRecord);
    assert.ok(bobRecord);
  });
});

test('create and read HealthRecord', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/idsov-hApp-concept.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleHealthRecord(alice.cells[0]);
    console.log(JSON.stringify(sample));

    // Alice creates a HealthRecord
    const record: Record = await createHealthRecord(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created HealthRecord
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_original_health_record",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);

  });
});

test('create and update HealthRecord', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/idsov-hApp-concept.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a HealthRecord
    const record: Record = await createHealthRecord(alice.cells[0]);
    assert.ok(record);
        
    const originalActionHash = record.signed_action.hashed.hash;
 
    // Alice updates the HealthRecord
    let contentUpdate: any = await sampleHealthRecord(alice.cells[0]);
    let updateInput = {
      original_health_record_hash: originalActionHash,
      previous_health_record_hash: originalActionHash,
      updated_health_record: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "update_health_record",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated HealthRecord
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_latest_health_record",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the HealthRecord again
    contentUpdate = await sampleHealthRecord(alice.cells[0]);
    updateInput = { 
      original_health_record_hash: originalActionHash,
      previous_health_record_hash: updatedRecord.signed_action.hashed.hash,
      updated_health_record: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "update_health_record",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the updated HealthRecord
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_latest_health_record",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

    // Bob gets all the revisions for HealthRecord
    const revisions: Record[] = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_all_revisions_for_health_record",
      payload: originalActionHash,
    });
    assert.equal(revisions.length, 3);
    assert.deepEqual(contentUpdate, decode((revisions[2].entry as any).Present.entry) as any);
  });
});

test('create and delete HealthRecord', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../workdir/idsov-hApp-concept.happ';

    // Set up the app to be installed 
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleHealthRecord(alice.cells[0]);

    // Alice creates a HealthRecord
    const record: Record = await createHealthRecord(alice.cells[0], sample);
    assert.ok(record);

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);


    // Alice deletes the HealthRecord
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "delete_health_record",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
        
    // Bob gets the oldest delete for the HealthRecord
    const oldestDeleteForHealthRecord: SignedActionHashed = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_oldest_delete_for_health_record",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(oldestDeleteForHealthRecord);
        
    // Bob gets the deletions for the HealthRecord
    const deletesForHealthRecord: SignedActionHashed[] = await bob.cells[0].callZome({
      zome_name: "tdd_zome",
      fn_name: "get_all_deletes_for_health_record",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(deletesForHealthRecord.length, 1);


  });
});
