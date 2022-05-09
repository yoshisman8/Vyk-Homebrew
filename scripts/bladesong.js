Hooks.on('createCombat', async (document,data,id) => {
    if(!document.data.flags.hasOwnProperty('vyklade')){
        document.update({['flags.vyklade.initiated']:false});
    }
});

Hooks.on('updateCombat', async (document,data,diff,id) =>{
    if(document.data.flags.vyklade.initiated) return;
    if(!document.started) return;
    
    const UUID = "Compendium.vyk-homebrew.bladesong.c1eGS70Zyts97NOz";
    
    let source = (await fromUuid(UUID)).toObject();
    source.flags.core ?? {};
    source.flags.core.sourceId = UUID;
    
    let comb = Array.from(document.combatants.values());
    
    comb.forEach(async (C) => {
        let a = C.actor;
        let options = a.getRollOptions(['all']);
        if(!a) return;
        
        if(!a.isOwner) return;
        if(game.user.isGM) return;
        
        if(options.includes("feat:bladesong-dedication")){
            let feat = options.includes("feat:shimmering-edge");
            
            const existing = a.itemTypes.effect.find((effect) => effect.getFlag('core', 'sourceId') === UUID);
            if(existing){
                let mirages = existing.data.data.level.value + (feat? 3:2);
                
                await existing.delete();
                source.data.level.value = mirages;
                source.img = `modules/vyk-homebrew/assets/Bladesong/mirrage${mirrages}.png`;
                await a.createEmbeddedDocuments('Item', [source]);
            }
            else{
                source.data.level.value = (feat? 3:2);
                source.img = `modules/vyk-homebrew/assets/Bladesong/mirrage${(feat? 3:2)}.png`;
                await a.createEmbeddedDocuments('Item', [source]);
            }
            
        }
        
    });
    
    document.update({['flags.vyklade.initiated']:true})
});