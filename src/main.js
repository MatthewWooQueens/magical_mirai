import { Application,Container,Text, Graphics, Point, Circle, Assets,Sprite, AnimatedSprite, v8_3_4 } from "pixi.js";
import { Ease, Player } from "textalive-app-api";
import dotenv from 'dotenv';
import water1Url from './assets/water1.webp'
import water2Url from './assets/water2.webp'
import water3Url from './assets/water3.webp'
import grassUrl  from './assets/grass.webp'

const token = import.meta.env.TOKEN

//Imie
//https://piapro.jp/t/9o24/20251215164617
//126519
//30200

//Curtain
//https://piapro.jp/t/zoqO/20251214200738
//126591
//28627

//Shutter Chance
//https://piapro.jp/t/PNpQ/20251209170719
//126542
//29844

//Last March on Earth
//https://piapro.jp/t/B3yJ/20251215061727
//126594
//29733

//Toritsukulogy
//https://piapro.jp/t/QBdL/20251215094303
//126593
//28630

//TAKEOVER
//https://piapro.jp/t/E2i3/20251215092113
//126533
//28631



// TextAlive Player を作る
//https://developer.textalive.jp/apps/cRH41SQT8Qmz0qms/
class TextAlivePlayer{
  constructor(){
    this.player = new Player({ 
      app: { token: token },
      mediaElement: document.querySelector("#media"),
    });
    this.player.volume = 50
    this.player.addListener({
      // 動画オブジェクトの準備が整ったとき（楽曲に関する情報を読み込み終わったとき）に呼ばれる
      onAppReady: (app) => {
        if (!app.songUrl) {
          // URLを指定して楽曲をもとにした動画データを作成
          this.player.createFromSongUrl("https://piapro.jp/t/E2i3/20251215092113", {
            video: {
              // 音楽地図訂正履歴
              //beatId: 4827293,
              //chordId: 2963754,
              //repetitiveSegmentId: 3086261,

              // 歌詞URL: https://piapro.jp/t/9o24
              // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2F6W2N%2F20251215164617
              lyricId: 126533,
              lyricDiffId: 28631
            }
          },)
        }
      },
      onPlay: () => {
        this.player.requestPlay()
      },
    });
  }
}


let letterList = []
const font = 25
class letterObj{
  constructor(char,x,y){
    this.char = char
    this.speed = 1.5
    this.graphic = new Text({text:this.char, style:{fontSize:font, fill:"#000000"}})
    this.graphic.x = x
    this.graphic.y = Math.floor(Math.random() * (Math.floor(GAME_HEIGHT*0.8-font)-GAME_HEIGHT*0.15) + GAME_HEIGHT*0.15)
  }
  move(delta){
    if(this.graphic.x > -8){
      this.graphic.x-=this.speed*delta;
    }else{
      letterList.shift()
      this.graphic.parent.removeChild(this.graphic)  
    }
  }
}

class spatialMap{
  constructor(cellSize,width,height){
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.spatialmap = Array.from({ length: this.cols * this.rows + 1 }, () => []);
  }
  index(indx,indy){
    const clampedX = Math.max(0, Math.min(indx, this.cols - 1))
    const clampedY = Math.max(0, Math.min(indy, this.rows - 1))
    return clampedX * this.rows + clampedY
  }
  updateGrid(width,height){
    this.cols = Math.ceil(width / (this.cellSize));
    this.rows = Math.ceil(height / (this.cellSize));
  }
  addLetters(letterList){
    for (const p of letterList){
      const fx = Math.floor(p.graphic.x/this.cellSize)
      const fy = Math.floor(p.graphic.y/this.cellSize)
      const cx = Math.floor((p.graphic.x+p.graphic.width)/this.cellSize)
      const cy = Math.floor((p.graphic.y+p.graphic.height)/this.cellSize)
      const cellsx = fx===cx?[fx]:[fx,cx]
      const cellsy = fy===cy?[fy]:[fy,cy]
      for(const indx of cellsx){
        for(const indy of cellsy){
          const res = this.index(indx,indy)
          this.spatialmap[res].push(p)
        }
      }
    }
  }
  clear() {
    this.spatialmap.forEach(cell => cell.length = 0)
  }
}

class pulseTest{
  constructor(target){
    this.target = target;
    this.elapsed = 0
    this.active = false
  }
  trigger(){
    this.elapsed = 0
    this.active = true
  }
  update(delta){
    if(!this.active) return
    this.elapsed += delta.deltaTime * 0.1
    const pulse = 1 + Math.sin(this.elapsed*Math.PI) * 0.3
    this.target.scale.set(pulse)
    if (this.elapsed >= 1){
      this.active = false
      this.target.scale.set(1)
    }
  }
}

class WaterRing {
  constructor(container) {
    this.rings = []
    this.container = container
  }

  trigger(count = 3, color = 0x44aaff,x,y) {
    for (let i = 0; i < count; i++) {
      const g = new Graphics()
      g.position.set(x, y)
      this.container.addChild(g)
      this.rings.push({ g, r: 8 + i * 18, alpha: 1, color })
    }
  }

  update(delta) {
    const speed = 3
    const maxR  = 100

    this.rings = this.rings.filter(ring => {
      ring.r += speed * delta.deltaTime
      ring.alpha  = Math.max(0, 1 - ring.r / maxR)

      ring.g.clear()
      ring.g.circle(0, 0, ring.r)
        .stroke({ color: ring.color, alpha: ring.alpha, width: 2 })

      if (ring.alpha <= 0) {
        ring.g.destroy()
        return false
      }
      return true
    })
  }
}
  
const GAME_WIDTH = 1536
const GAME_HEIGHT = 776

let score = 0;
const mainPlayer = new TextAlivePlayer();
(async () =>{
  const app = new Application();
  await app.init({background:'#000000', resizeTo:window})
  document.body.appendChild(app.canvas);
  const container = new Container({});


const textureGrass = await Assets.load('./assets/grass.webp')
const textureWater = await Promise.all([
    Assets.load('./assets/water1.webp'),
    Assets.load('./assets/water2.webp'),
    Assets.load('./assets/water3.webp')
  ])


  app.renderer.on('resize', (width, height) => {
    const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT)
    container.scale.set(scale)
    container.x = (width  - GAME_WIDTH  * scale) / 2
    container.y = (height - GAME_HEIGHT * scale) / 2
  })

  app.stage.addChild(container);
  app.resize()

  const grassSprite = new Sprite(textureGrass)
  grassSprite.height = GAME_HEIGHT*0.2
  grassSprite.width = GAME_WIDTH
  grassSprite.y = GAME_HEIGHT*0.8
  container.addChild(grassSprite)

  const waterSprite = new AnimatedSprite(textureWater)
  waterSprite.width = GAME_WIDTH
  waterSprite.height = GAME_HEIGHT*0.65
  waterSprite.y = GAME_HEIGHT*0.15
  waterSprite.animationSpeed = 0.0125
  waterSprite.play()
  container.addChild(waterSprite)

  const waterRipple = new WaterRing(container)

  const sky = new Graphics()
  sky.zIndex = 50
  container.addChild(sky)
  sky.rect(0,0,GAME_WIDTH,GAME_HEIGHT*0.15).fill('#79f8ff')

  const stuff = new Text({text:score,style:{fontSize:46, fill:"#ffffff"}})
  
  stuff.position.set(20,135)
  container.addChild(stuff);

  const rect = new Graphics();
  rect.zIndex = 52
  container.addChild(rect);


  const shoot = new Graphics().circle(GAME_WIDTH/2,GAME_HEIGHT*0.8,20).fill('#000000')
  const aim = new Graphics()
  aim.position.set(GAME_WIDTH/2, GAME_HEIGHT*0.8)
  aim.pivot.set(0, 0)
  container.addChild(shoot)
  container.addChild(aim)
  

  let point = {x:aim.x,y:aim.y}
  let down = false
  shoot.eventMode = 'static'

  let projectileList = []

  const spatialmap = new spatialMap(font*1.25,GAME_HEIGHT,GAME_WIDTH)

  shoot.on('mousedown',(e)=>{
    if(!mainPlayer.player.isPlaying) return
    down = true
    const anchorProjectile = new Graphics()
    projectileList.push(anchorProjectile)
    anchorProjectile.position.set(GAME_WIDTH/2, GAME_HEIGHT*0.8)
    container.addChild(anchorProjectile)
    anchorProjectile.circle(0,0,5).fill('#ffffff');
    anchorProjectile.range = 0
    anchorProjectile.visible = false
  })

  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen;
  app.stage.on('mousemove',(e)=>{
    if(down){
      point.x = e.getLocalPosition(container).x
      point.y = e.getLocalPosition(container).y
    }
  })
  app.stage.on('mouseup',(e)=>{
    if(!mainPlayer.player.isPlaying) return
    down = false
    aim.clear()
    point.x=aim.x
    point.y=aim.y
    projectileList[projectileList.length-1].visible = true

  })
  
  let prevChar = null;
  let prevBeat = null

  const lyric = new Text()
  lyric.zIndex = 51
  lyric.x = GAME_WIDTH*0.3
  lyric.y = 20
  container.addChild(lyric)

  app.ticker.add((delta)=>{
    if (!mainPlayer.player.timer || !mainPlayer.player.video) return;
    rect.clear()
    const position = mainPlayer.player.timer.position;

    const curPhrase = mainPlayer.player.video.findPhrase(position)
    if(curPhrase){
      console.log(curPhrase.text)
      lyric.text = curPhrase.text
    }

    const char = mainPlayer.player.video.findChar(position)
    if(char){
      if(prevChar!==char.text){
        const newChar = new letterObj(char.text,GAME_WIDTH,GAME_HEIGHT)
        letterList.push(newChar)
        container.addChild(newChar.graphic)
        prevChar = char.text
      }
    }

    const progress = mainPlayer.player.video.progress(position)
    const rectwidth = progress * GAME_WIDTH*0.4;
    rect.roundRect(GAME_WIDTH*0.3,10,GAME_WIDTH*0.4,10,10).fill('#a5a5a5');
    rect.roundRect(GAME_WIDTH*0.3, 10, rectwidth, 10,10).fill('#ffffff');
    
    stuff.text = score

    for (const x of letterList){
      x.move(delta.deltaTime);
    }
    spatialmap.clear()
    spatialmap.updateGrid(GAME_WIDTH,GAME_HEIGHT)
    spatialmap.addLetters(letterList)

    if(down){
      const direction = {x:point.x-aim.position.x,y:point.y-aim.position.y}
      const radians = Math.atan2(direction.y,direction.x) + Math.PI/2
      aim.rotation = radians

      const newHeight = Math.min(300,Math.sqrt((direction.x)**2 + (direction.y)**2)**1.3)
      projectileList[projectileList.length-1].range = newHeight
      projectileList[projectileList.length-1].rotation = radians
      aim.clear()
      aim.rect(-2.5, 0, 5, newHeight).fill('#ffffff');

    }

    const s = mainPlayer.player.findBeat(position);
    const cols = Math.ceil(GAME_WIDTH / (font*1.25));
    const rows = Math.ceil(GAME_HEIGHT / (font*1.25));
    for(const p of projectileList){
      if(p.x < -5 || p.x > GAME_WIDTH+5 || p.y < GAME_HEIGHT*0.15 || p.y>GAME_HEIGHT*0.8+5){
        p.parent.removeChild(p)
        p.destroy()
        projectileList.splice(projectileList.indexOf(p),1)
        continue
      }else if(p.visible){
        p.x += Math.cos(p.rotation + Math.PI/2)*delta.deltaTime * 2
        p.y += Math.sin(p.rotation + Math.PI/2)*delta.deltaTime * 2
        if(s && s.index!==prevBeat){
          waterRipple.trigger(1,'0x44aaff', p.x,p.y)
        }
      }

      const cx1 = Math.floor((p.x - p.width/2)  / (font*1.25))
      const cy1 = Math.floor((p.y - p.height/2) / (font*1.25))
      const cx2 = Math.floor((p.x + p.width/2)  / (font*1.25))
      const cy2 = Math.floor((p.y + p.height/2) / (font*1.25))

      const cellsToCheck = new Set()
      for (let ix = cx1; ix <= cx2; ix++) {
        for (let iy = cy1; iy <= cy2; iy++) {
          const res = ix * rows + iy
          if (res >= 0 && res < cols * rows) cellsToCheck.add(res)
        }
      }
      for (const res of cellsToCheck) {
        let hit = null
        for (const letters of spatialmap.spatialmap[res]) {
          if (!letterList.includes(letters)){
            continue
          }
          //bottom left
          const [x1,y1] = [letters.graphic.x,letters.graphic.y+letters.graphic.height]
          //top right
          const [x2,y2] = [letters.graphic.x+letters.graphic.width,letters.graphic.y]

          //bottom left
          const [j1,k1] = [p.x-p.width/2,p.y+p.height/2]
          //top right
          const [j2,k2] = [p.x+p.width/2,p.y-p.height/2]

          if (x1<=j2 && y1>=k2 && x2 >= j1 && y2 <= k1){
            hit = letters
            break

          }else{
            console.info(letters)
          }
        }
        if(hit){
          score++
          if(hit.graphic.parent){
            hit.graphic.parent.removeChild(hit.graphic)
            hit.graphic.destroy()
          }
          const ind = letterList.indexOf(hit)
          letterList.splice(ind,1)
        }
      }
    }
    if(s){
      prevBeat = s.index
    }
    waterRipple.update(delta)
  })
})()


//Stone skipping