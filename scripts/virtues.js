Hooks.on('updateCombat', async (Enc, Round,diff,id) =>{
    console.log([Enc,Round,diff,id]);
    
    if(Enc.started === false) return;
    
    if(Enc.current.round > 1) return;
    if(Enc.current.turn > 0) return;
    
    const UUID = "Compendium.vyk-homebrew.virtuous-guardian.U34nOhwMHkl8t9R7";
    
    let source = (await fromUuid(UUID)).toObject();
    source.flags.core ?? {};
    source.flags.core.sourceId = UUID;
    source.flags.vyklade = {};
    source.flags.vyklade.obtained = true;
    
    let comb = Array.from(Enc.combatants.values());
    
    comb.forEach(async (C) => {
        let a = C.actor;
        
        if(!a) return;
        
        if(a.getRollOptions(['all']).includes("feature:virtues")){
            const existing = a.itemTypes.effect.find((effect) => effect.getFlag('core', 'sourceId') === UUID);
            if(existing){
                if(existing.data.flags.hasOwnProperty('vyklade')){
                    if(existing.data.flags.vyklade.obtained) return;
                }
                await existing.delete();
            }
            source.data.level.value = 3;
            await a.createEmbeddedDocuments('Item', [source]);
        }
        
    })
});