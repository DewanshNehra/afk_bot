const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const collectBlock = require('mineflayer-collectblock').plugin
const { performance } = require('perf_hooks')
const autoeat = require('mineflayer-auto-eat')
const GoalFollow = goals.GoalFollow



const bot = mineflayer.createBot({
    host: 'basanti1.aternos.me',
    port: 21508,
    username: 'basanti',
})

bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)
bot.loadPlugin(collectBlock)
bot.loadPlugin(mineflayerAutoEat)

let mcData
bot.once('spawn', () => {
  mcData = require('minecraft-data')(bot.version)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea (pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})

bot.on('physicTick', () => {
  if (!guardPos) return

  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 2 &&
                      e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?

  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})

//SLEEP COMMAND 

bot.on('chat', (username, message) => {
  if (username === bot.username) return
  switch (message) {
    case 'sleep':
      goToSleep()
      break
    case 'wakeup':
      wakeUp()
      break
  }
})

bot.on('sleep', () => {
  bot.chat('Good night!')
})
bot.on('wake', () => {
  bot.chat('Good morning!')
})

async function goToSleep () {
  const bed = bot.findBlock({
    matching: block => bot.isABed(block)
  })
  if (bed) {
    try {
      await bot.sleep(bed)
      bot.chat("I'm sleeping")
    } catch (err) {
      bot.chat(`I can't sleep: ${err.message}`)
    }
  } else {
    bot.chat('No nearby bed')
  }
}

async function wakeUp () {
  try {
    await bot.wake()
  } catch (err) {
    bot.chat(`I can't wake up: ${err.message}`)
  }
}

bot.on('chat', (username, message) => {
  if (message === 'g') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('I will guard that location.')
    guardArea(player.entity.position)
  }

  if (message === 'fight me') {
    const player = bot.players[username]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }

  if (message === 'fight event') {
    const player = bot.players[EventHorizon2004]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }

  if (message === 'fight sama') {
    const player = bot.players[ULT1M4T3]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }

  if (message === 'fight jamal') {
    const player = bot.players[jamal]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }

  if (message === 'fight aryaman') {
    const player = bot.players[killshot2709]

    if (!player) {
      bot.chat("I can't see you.")
      return
    }

    bot.chat('Prepare to fight!')
    bot.pvp.attack(player.entity)
  }




  if (message === 'stop') {
    bot.chat('I will no longer guard this area.')
    stopGuarding()
  }
})
bot.on('chat', (username, message) => {
  if (message.startsWith('kill')) {
    const target = message.substring(6)
    const player = bot.players[target]
    bot.pvp.attack(player.entity)
  }
})


// block finder
bot.on('chat', async (username, message) => {
  if (username === bot.username) return

  const mcData = require('minecraft-data')(bot.version)

  if (message === 'loaded') {
    console.log(bot.entity.position)
    await bot.waitForChunksToLoad()
    bot.chat('Ready!')
  }

  if (message.startsWith('find')) {
    const name = message.split(' ')[1]
    if (mcData.blocksByName[name] === undefined) {
      bot.chat(`${name} is not a block name`)
      return
    }
    const ids = [mcData.blocksByName[name].id]

    const startTime = performance.now()
    const blocks = bot.findBlocks({ matching: ids, maxDistance: 128, count: 10 })
    const time = (performance.now() - startTime).toFixed(2)

    bot.chat(`I found ${blocks.length} ${name} blocks in ${time} ms`)
  }
})

// Listen for when a player says "collect [something]" in chat
bot.on('chat', (username, message) => {
  const args = message.split(' ')
  if (args[0] !== 'collect') return

  // Get the correct block type
  const blockType = mcData.blocksByName[args[1]]
  if (!blockType) {
    bot.chat("I don't know any blocks with that name.")
    return
  }

  bot.chat('Collecting the nearest ' + blockType.name)

  // Try and find that block type in the world
  const block = bot.findBlock({
    matching: blockType.id,
    maxDistance: 64
  })

  if (!block) {
    bot.chat("I don't see that block nearby.")
    return
  }

  // Collect the block if we found one
  bot.collectBlock.collect(block, err => {
    if (err) bot.chat(err.message)
  })
})


// AUTO EAT 

// Load the plugin
bot.loadPlugin(autoeat)

bot.once('spawn', () => {
  bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 14,
    bannedFood: []
  }
})
// The bot eats food automatically and emits these events when it starts eating and stops eating.

bot.on('autoeat_started', () => {
  console.log('Auto Eat started!')
})

bot.on('autoeat_stopped', () => {
  console.log('Auto Eat stopped!')
})

bot.on('health', () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points`
  else bot.autoEat.enable() // Else enable the plugin again
})

//FOLLOW ME COMMAND 

function stopfollowPlayer () {
  bot.pathfinder.setGoal(null)
}

function followPlayer() {
    const playerCI = bot.players['devildark']

    if (!playerCI || !playerCI.entity) {
        bot.chat("I can't see CI!")
        return
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.scafoldingBlocks = []

    bot.pathfinder.setMovements(movements)

    const goal = new GoalFollow(playerCI.entity, 2)
    bot.pathfinder.setGoal(goal, true)
}


bot.on('chat', (username, message) => {
  if(message === 'fm'){
    bot.chat('I am following devildark now')
    followPlayer()
  }
  
  if (message === 'df') {
    bot.chat('ohk sir.')
    stopfollowPlayer()
  }
})
