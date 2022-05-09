
Hooks.once('socketlib.ready', () =>{
    let socket;
    
    socket = socketlib.registerModule("vyk-homebrew");

    Hooks.on('updateToken', async (document,updateData) => { await handleVirtueTokenUpdate(document,updateData,socket) });
    
    Hooks.on('createItem', async (document,updateData) => { await handleVirtueCreateItem(document,updateData,socket) });

    Hooks.on('deleteItem', async (document,updateData) => { await handleVirtueDeleteItem(document,updateData,socket)});
});

async function handleVirtueTokenUpdate(document,updateData, socket){
    // If this update contains no movement, ignore it
    if(!updateData.x && !updateData.y) return;
    
    // Fetch if there are any virtuous Guardians in the map.
    const guardians = Array.from(document.scene.tokens).filter(x=>x.actor.itemTypes.feat.filter(f=>f.name === "Virtue").length > 0)

    // If no dancers are on the map, terminate.
    if(guardians.length < 0) return;
    
    // Declaring all UUIDs for all buffs.
    const MIGHT = `Compendium.vyk-homebrew.virtuous-guardian.Cjarr04lqCcB75Of`;
    const MIGHT2 = `Compendium.vyk-homebrew.virtuous-guardian.bo1CSluHNQ3ztMHg`;
    const AEGIS = `Compendium.vyk-homebrew.virtuous-guardian.Ap37QxLClv7cVP8C`;
    const AEGIS2 = `Compendium.vyk-homebrew.virtuous-guardian.giA1sdr12JgWkyMV`;
    const MERCY = `Compendium.vyk-homebrew.virtuous-guardian.DazQmDJyGNppO9kj`;
    const MERCY2 = `Compendium.vyk-homebrew.virtuous-guardian.SSl9FIYtax13Qtwf`;
    
    
    // Itterate each guardian on the map
    guardians.forEach(async (token) => {
        let options = token.actor.getRollOptions(['all']);
        
        if(!options.includes('brand:active')) return;
        
        let enkindle = options.includes('brand:enkindle');
        
        let cha = token.actor.data.data.abilities.cha.mod;
        
        let pos = canvas.grid.getCenter(token.data.x,token.data.y);
        
        let inRadius = warpgate.crosshairs.collect({
            x:pos[0],
            y:pos[1],
            radius:canvas.grid.size * 3.4,
            scene:token.scene
        }, ["Token"]);
        
        let alliesInRadius = inRadius.Token.filter(x=>x.data.disposition === 1);
        
        let alliesOutRadius = Array.from(token.scene.tokens).filter(x=>x.data.disposition === 1);
        
        let inRadiusSet = new Set(alliesInRadius);
        
        let alliesOutFiltered = alliesOutRadius.filter(x=> !inRadiusSet.has(x));
        
        let buffs = [];
        
        if(options.includes('brand:might')){
            let mightBuff = (await fromUuid(MIGHT)).toObject();
            mightBuff.flags.core ??= {};
            mightBuff.flags.core.sourceId = MIGHT;
            buffs.push(mightBuff);
            
            if(enkindle) {
                let mightBuff2 = (await fromUuid(MIGHT2)).toObject();
                mightBuff2.flags.core ??= {};
                mightBuff2.flags.core.sourceId = MIGHT2;
                buffs.push(mightBuff2);
            }
        }
        if(options.includes('brand:aegis')){
            let aegisBuff = (await fromUuid(AEGIS)).toObject();
            aegisBuff.flags.core ??= {};
            aegisBuff.flags.core.sourceId = AEGIS;
            aegisBuff.data.level.value = cha;
            buffs.push(aegisBuff);
            
            if(enkindle) {
                let aegisBuff2 = (await fromUuid(AEGIS2)).toObject();
                aegisBuff2.flags.core ??= {};
                aegisBuff2.flags.core.sourceId = AEGIS2;
                aegisBuff2.data.level.value = cha;
                buffs.push(aegisBuff2);
            }
        }
        if(options.includes('brand:mercy')){
            let mercyBuff = (await fromUuid(MERCY)).toObject();
            mercyBuff.flags.core ??= {};
            mercyBuff.flags.core.sourceId = MERCY;
            mercyBuff.data.level.value = cha;
            buffs.push(mercyBuff);
            
            if(enkindle) {
                let mercyBuff2 = (await fromUuid(MERCY2)).toObject();
                mercyBuff2.flags.core ??= {};
                mercyBuff2.flags.core.sourceId = MERCY2;
                mercyBuff2.data.level.value = cha;
                buffs.push(mercyBuff2);
            }
        }
        
        let outBuffer = [];
        
        alliesOutFiltered.forEach(async (O)=>{
            if (outBuffer.includes(O)) return;
            
            let onlineOwners = game.users.filter(x=> !x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);

            
            if(!game.user.isGM && O.actor.isOwner){
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(existing){
                        await existing.delete();
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            }else if (game.user.isGM && !O.actor.hasPlayerOwner) {
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(existing){
                        await existing.delete();
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(existing){
                        await existing.delete();
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            }
            
            
            outBuffer.push(O);
        })
        
        let inBuffer = [];
        
        
        
        alliesInRadius.forEach(async (O)=>{
            if (inBuffer.includes(O)) return;
            
            let onlineOwners = game.users.filter(x=>!x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);
            
            if(!game.user.isGM && O.actor.isOwner){
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(!existing){
                        await O.actor.createEmbeddedDocuments('Item', [B]); 
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            }
            else if(game.user.isGM && !O.actor.hasPlayerOwner){
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(!existing){
                        await O.actor.createEmbeddedDocuments('Item', [B]); 
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
                buffs.forEach(async (B) =>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                    if(!existing){
                        await O.actor.createEmbeddedDocuments('Item', [B]); 
                    }
                });
                cleanup.forEach(async (B)=>{
                    let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                    if(existing){
                        await existing.delete();
                    }
                });
            }
            
            inBuffer.push(O);
        })
    });
}

async function handleVirtueCreateItem(document,updateData, socket){
    if(document.type != "effect") return;
    
    // Declare all Stance UUIDs
    const STANCES = [`Compendium.vyk-homebrew.virtuous-guardian.NUbxs8z2O7VwIJLU`,`Compendium.vyk-homebrew.virtuous-guardian.h8RylCjB49tlpxWj`,`Compendium.vyk-homebrew.virtuous-guardian.tlbUpeXnK2UUdCTa`,`Compendium.vyk-homebrew.virtuous-guardian.zfFuV8jM623xzYq2`];
    
    if(!STANCES.includes(document.data.flags.core.sourceId)) return;
        
    const actor = document.parent;
    
    if(!actor.getRollOptions(['all']).includes('brand:active')) return;
    
    const token = game.scenes.current.tokens.find(x=>x.actor.id === actor.id);
    
    if(!token) return;
    
    // Declaring all UUIDs for all buffs.
    const MIGHT = `Compendium.vyk-homebrew.virtuous-guardian.Cjarr04lqCcB75Of`;
    const MIGHT2 = `Compendium.vyk-homebrew.virtuous-guardian.bo1CSluHNQ3ztMHg`;
    const AEGIS = `Compendium.vyk-homebrew.virtuous-guardian.Ap37QxLClv7cVP8C`;
    const AEGIS2 = `Compendium.vyk-homebrew.virtuous-guardian.giA1sdr12JgWkyMV`;
    const MERCY = `Compendium.vyk-homebrew.virtuous-guardian.DazQmDJyGNppO9kj`;
    const MERCY2 = `Compendium.vyk-homebrew.virtuous-guardian.SSl9FIYtax13Qtwf`;

    let options = token.actor.getRollOptions(['all']);
    
    let cha = token.actor.data.data.abilities.cha.mod;
    
    let enkindle = options.includes('brand:enkindle');
    
    let pos = canvas.grid.getCenter(token.data.x,token.data.y);
    
    let inRadius = warpgate.crosshairs.collect({
        x:pos[0],
        y:pos[1],
        radius:canvas.grid.size * 3.4,
        scene:token.scene
    }, ["Token"]);
    
    let alliesInRadius = inRadius.Token.filter(x=>x.data.disposition === 1);
    
    let alliesOutRadius = Array.from(token.scene.tokens).filter(x=>x.data.disposition === 1);
    
    let inRadiusSet = new Set(alliesInRadius);
    
    let alliesOutFiltered = alliesOutRadius.filter(x=> !inRadiusSet.has(x));
    
    let buffs = [];
    
    if(options.includes('brand:might')){
        let mightBuff = (await fromUuid(MIGHT)).toObject();
        mightBuff.flags.core ??= {};
        mightBuff.flags.core.sourceId = MIGHT;
        buffs.push(mightBuff);
        
        if(enkindle) {
            let mightBuff2 = (await fromUuid(MIGHT2)).toObject();
            mightBuff2.flags.core ??= {};
            mightBuff2.flags.core.sourceId = MIGHT2;
            buffs.push(mightBuff2);
        }
    }
    if(options.includes('brand:aegis')){
        let aegisBuff = (await fromUuid(AEGIS)).toObject();
        aegisBuff.flags.core ??= {};
        aegisBuff.flags.core.sourceId = AEGIS;
        aegisBuff.data.level.value = cha;
        buffs.push(aegisBuff);
        
        if(enkindle) {
            let aegisBuff2 = (await fromUuid(AEGIS2)).toObject();
            aegisBuff2.flags.core ??= {};
            aegisBuff2.flags.core.sourceId = AEGIS2;
            aegisBuff2.data.level.value = cha;
            buffs.push(aegisBuff2);
        }
    }
    if(options.includes('brand:mercy')){
        let mercyBuff = (await fromUuid(MERCY)).toObject();
        mercyBuff.flags.core ??= {};
        mercyBuff.flags.core.sourceId = MERCY;
        mercyBuff.data.level.value = cha;
        buffs.push(mercyBuff);
        
        if(enkindle) {
            let mercyBuff2 = (await fromUuid(MERCY2)).toObject();
            mercyBuff2.flags.core ??= {};
            mercyBuff2.flags.core.sourceId = MERCY2;
            mercyBuff2.data.level.value = cha;
            buffs.push(mercyBuff2);
        }
    }
    
    let outBuffer = [];
    
    alliesOutFiltered.forEach(async (O)=>{
        if (outBuffer.includes(O)) return;
        
        let onlineOwners = game.users.filter(x=> !x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);

        
        if(!game.user.isGM && O.actor.isOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }else if (game.user.isGM && !O.actor.hasPlayerOwner) {
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        
        
        outBuffer.push(O);
    })
    
    let inBuffer = [];
    
    
    
    alliesInRadius.forEach(async (O)=>{
        if (inBuffer.includes(O)) return;
        
        let onlineOwners = game.users.filter(x=>!x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);
        
        if(!game.user.isGM && O.actor.isOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        else if(game.user.isGM && !O.actor.hasPlayerOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        
        inBuffer.push(O);
    })
}

async function handleVirtueDeleteItem(document,updateData, socket){
    if(document.type != "effect") return;
    
    // Declare all Stance UUIDs
    const STANCES = [`Compendium.vyk-homebrew.virtuous-guardian.NUbxs8z2O7VwIJLU`,`Compendium.vyk-homebrew.virtuous-guardian.h8RylCjB49tlpxWj`,`Compendium.vyk-homebrew.virtuous-guardian.tlbUpeXnK2UUdCTa`,`Compendium.vyk-homebrew.virtuous-guardian.zfFuV8jM623xzYq2`];
    
    if(!STANCES.includes(document.data.flags.core.sourceId)) return;
        
    const actor = document.parent;
    
    const token = game.scenes.current.tokens.find(x=>x.actor.id === actor.id);
    
    if(!token) return;
    
    // Declaring all UUIDs for all buffs.    
    const MIGHT = `Compendium.vyk-homebrew.virtuous-guardian.Cjarr04lqCcB75Of`;
    const MIGHT2 = `Compendium.vyk-homebrew.virtuous-guardian.bo1CSluHNQ3ztMHg`;
    const AEGIS = `Compendium.vyk-homebrew.virtuous-guardian.Ap37QxLClv7cVP8C`;
    const AEGIS2 = `Compendium.vyk-homebrew.virtuous-guardian.giA1sdr12JgWkyMV`;
    const MERCY = `Compendium.vyk-homebrew.virtuous-guardian.DazQmDJyGNppO9kj`;
    const MERCY2 = `Compendium.vyk-homebrew.virtuous-guardian.SSl9FIYtax13Qtwf`;

    let options = token.actor.getRollOptions(['all']);
    
    let enkindle = options.includes('brand:enkindle');
    
    let pos = canvas.grid.getCenter(token.data.x,token.data.y);
    
    let inRadius = warpgate.crosshairs.collect({
        x:pos[0],
        y:pos[1],
        radius:canvas.grid.size * 3.4,
        scene:token.scene
    }, ["Token"]);
    
    let alliesInRadius = inRadius.Token.filter(x=>x.data.disposition === 1);
    
    let alliesOutRadius = Array.from(token.scene.tokens).filter(x=>x.data.disposition === 1);
    
    let inRadiusSet = new Set(alliesInRadius);
    
    let alliesOutFiltered = alliesOutRadius.filter(x=> !inRadiusSet.has(x));
    
    let buffs = [];
    
    let cleanup = [];
    
    if(options.includes('brand:might')){
        let mightBuff = (await fromUuid(MIGHT)).toObject();
        mightBuff.flags.core ??= {};
        mightBuff.flags.core.sourceId = MIGHT;
        buffs.push(mightBuff);
        
        if(enkindle) {
            let mightBuff2 = (await fromUuid(MIGHT2)).toObject();
            mightBuff2.flags.core ??= {};
            mightBuff2.flags.core.sourceId = MIGHT2;
            buffs.push(mightBuff2);
        } else{ 
            cleanup.push(MIGHT2);
        }
    } else{
        cleanup.push(MIGHT);
        cleanup.push(MIGHT2);
    }
    if(options.includes('brand:aegis')){
        let aegisBuff = (await fromUuid(AEGIS)).toObject();
        aegisBuff.flags.core ??= {};
        aegisBuff.flags.core.sourceId = AEGIS;
        buffs.push(aegisBuff);
        
        if(enkindle) {
            let aegisBuff2 = (await fromUuid(AEGIS2)).toObject();
            aegisBuff2.flags.core ??= {};
            aegisBuff2.flags.core.sourceId = AEGIS2;
            buffs.push(aegisBuff2);
        } else{ 
            cleanup.push(AEGIS2);
        }
    } else{
        cleanup.push(AEGIS);
        cleanup.push(AEGIS2);
    }
    
    if(options.includes('brand:mercy')){
        let mercyBuff = (await fromUuid(MERCY)).toObject();
        mercyBuff.flags.core ??= {};
        mercyBuff.flags.core.sourceId = MERCY;
        buffs.push(mercyBuff);
        
        if(enkindle) {
            let mercyBuff2 = (await fromUuid(MERCY2)).toObject();
            mercyBuff2.flags.core ??= {};
            mercyBuff2.flags.core.sourceId = MERCY2;
            buffs.push(mercyBuff2);
        }
    } else{
        cleanup.push(MERCY);
    }
    
    let outBuffer = [];
    
    alliesOutFiltered.forEach(async (O)=>{
        if (outBuffer.includes(O)) return;
        
        let onlineOwners = game.users.filter(x=> !x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);

        
        if(!game.user.isGM && O.actor.isOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }else if (game.user.isGM && !O.actor.hasPlayerOwner) {
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(existing){
                    await existing.delete();
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        
        
        outBuffer.push(O);
    })
    
    let inBuffer = [];
    
    
    
    alliesInRadius.forEach(async (O)=>{
        if (inBuffer.includes(O)) return;
        
        let onlineOwners = game.users.filter(x=>!x.isGM && x.active && O.actor.data.permission.hasOwnProperty(x.id) && O.actor.data.permission[x.id] === 3);
        
        if(!game.user.isGM && O.actor.isOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        else if(game.user.isGM && !O.actor.hasPlayerOwner){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        } else if(game.user.isGM && O.actor.hasPlayerOwner && onlineOwners.length === 0){
            buffs.forEach(async (B) =>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B.flags.core.sourceId);
                if(!existing){
                    await O.actor.createEmbeddedDocuments('Item', [B]); 
                }
            });
            cleanup.forEach(async (B)=>{
                let existing = O.actor.itemTypes.effect.find((effect)=>effect.getFlag('core','sourceId') === B);
                if(existing){
                    await existing.delete();
                }
            });
        }
        
        inBuffer.push(O);
    })
}