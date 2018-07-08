var ctx,g_ctx,bw_ctx
var imageList=[]
var screen={}
var currentImage=null
var MIDI=null
window.addEventListener("load",function(evt){
  loadImageList()
  initNewScreen()
  navigator.requestMIDIAccess().then(midiacc=>listInputs(midiacc), x=>{});
  //var ctx = canvas.getContext("2d")

  //var g_ctx = grey_canvas.getContext("2d")
  //var bw_ctx = bw_canvas.getContext("2d")
})

function listInputs( midiAccess ) {
  available_midi_inputs.innerHTML=""
  midiAccess.inputs.forEach(item=>{
    var option=document.createElement("option")
    option.setAttribute("value",item.id)
    option.appendChild(document.createTextNode(item.name))
    available_midi_inputs.appendChild(option)
    item.onmidimessage = onMIDIMessage;
  })

}
var t1=new Date()
function onMIDIMessage( event ) {
  if(event.data[0]==176){
    //Controll Change event
    if((new Date())-t1>100){
      if(event.data[1]==parseInt(contrast_midi_ch.value)){
        contrast.value=map(event.data[2],0,127,-255,255)
        convertToGreyscale()
        t1= new Date()
        console.log(contrast.value)
      }
      if(event.data[1]==parseInt(brightness_midi_ch.value)){
        light.value=map(event.data[2],0,127,-255,255)
        convertToGreyscale()
        t1= new Date()
        console.log(contrast.value)
      }
    }
  }
}
function map (num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
class Pixel{
  constructor(x,y,val){
    this._val=val
    this.html=document.createElement("div")
    this.html.style.top=y*10+"px";
    this.html.style.left=x*10+"px";
    this.html.classList.add("pixel")
    this.x=x;
    this.y=y;
    this.index=y*64+x
    this.html.addEventListener("click",this,true)
    this.value=val
    this.screen=null
  }
  handleEvent(evt){
    if(this._val==1){
      this.value=0
    }else{
      this.value=1
    }
    this.screen.toCanvas(res_canvas)
  }
  set value(val){
    if(val==1 && !this.html.classList.contains("active")) this.html.classList.add("active")
    if(val==0 && this.html.classList.contains("active")) this.html.classList.remove("active")
    this._val=val
  }
  get value(){
    return this._val
  }
}
class Screen{
  constructor(w,h){
    this.width=w;
    this.height=h;
    this.html=document.createElement("div")
    this.html.classList.add("screen")
    this.html.style.width=10*w+"px"
    this.html.style.height=10*h+"px"
    this.pix=[]
    for(var x=0;x<w;x++){
      this.pix[x]=[]
      for(var y=0;y<h;y++){
        var p = new Pixel(x,y,0)
        p.screen=this
        this.pix[x].push(p)
        this.html.appendChild(p.html)
      }
    }
  }
  loadImage(buf){
    for(var x=0;x<this.width;x++){
      for(var y=0;y<this.height;y++){
        screen.pix[x][y].value=buf[y*this.width+x]
      }
    }
  }
  toCanvas(canvas){
    var ctx=canvas.getContext("2d")
    canvas.width=this.width;
    canvas.height=this.height;
    for(var x=0;x<this.width;x++){
      for(var y=0;y<this.height;y++){
        ctx.fillStyle="black"
        if(screen.pix[x][y].value==0){
          ctx.fillStyle="black"
          ctx.fillRect(x,y,1,1)
        } else {
          ctx.fillStyle="turquoise"
          ctx.fillRect(x,y,1,1)
        }
      }
    }
    this.toByteArray()
  }
  toByteArray(){
    var bmp_array=[]
    var tarr=[]
    for(var y=0;y<this.height;y++){
      for(var x=0;x<this.width;x++){
        tarr.push(this.pix[x][y].value)
      }
    }
    //var tarr= this.pix.map(item=>item.value)
    for(var i=0;i<tarr.length;i+=8){
      var tmp=tarr.slice(i,i+8)
      bmp_array.push(parseInt(tmp.join(""),2))
    }
    var r1=bmp_array.join(",")
    //var r2=RLE(tarr).join(",")
   output.value="static const unsigned char PROGMEM logo16_glcd_bmp[] ={"+r1+"};"
   //console.log("{"+r2.length+"}")

  }
}
function RLE(arr){
  var state=arr[0]
  var c=1
  var res=[]
  for(var i = 1;i<arr.length;i++){
    var v = arr[i]
    if(v==state && c<127){
      c++
    }else{
      var b = state.toString(2)+c.toString(2)
      res.push(parseInt(b,2))
      c=1
      state=v
    }
  }
  return res
}

function initNewScreen(){
  editor.innerHTML=""
  screen = new Screen(parseInt(dest_width.value),parseInt(dest_height.value))
  editor.appendChild(screen.html)
}

function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL("image/png");
}
function loadImage(){
  var img = new Image;
  img.onload = function() {
    // var canvas=document.getElementById("canvas")
    // console.log(img.width,img.height)
    // canvas.width=img.width
    // canvas.height=img.height
    // var ratio=img.width/img.height
    // var ctx = canvas.getContext("2d")
    // ctx.clearRect(0,0,img.width,img.height)
    // ctx.drawImage(img, 0,0,img.width,img.height);
    //var d = ctx.getImageData(0,0,img.width,img.height)
    //console.log(document.getElementById("canvas").toDataURL("image/png"))
    var data={
      src:getBase64Image(img),
      width:img.width,
      height:img.height,
      name:filepicker.files[0].name,
      type:filepicker.files[0].type,
      size:filepicker.files[0].size,
    }
    saveImageData(data)
  }
  if(filepicker.files.length>0) img.src = URL.createObjectURL(filepicker.files[0]);
}
function initStorage(){
  localStorage.setItem("imageList","[]")
  imageList=[]
}
function refreshImageList(){
  imagestore_list.innerHTML=""
  imageList=JSON.parse(localStorage.getItem('imageList'))
  imageList.forEach((item,index)=>{
    var div = document.createElement("div")
    var div2 = document.createElement("div")
    var div3 = document.createElement("div")
    var del = document.createElement("div")
    var img = document.createElement("img")
    img.setAttribute("data-listindex",index)
    del.setAttribute("data-listindex",index)
    div.classList.add("image_container")
    div2.classList.add("image_text")
    div3.classList.add("image_text")
    del.classList.add("delete_icon")

    img.src=item.src
    div2.appendChild(document.createTextNode(item.name))
    div3.appendChild(document.createTextNode(`(${item.width}x${item.height}, ${(item.size/1000).toFixed(2)}kB)`))
    div.appendChild(img)
    div.appendChild(div2)
    div.appendChild(div3)
    div.appendChild(del)
    del.addEventListener("click",deleteImage,false)
    img.addEventListener("click",convert,false)
    imagestore_list.appendChild(div)
  })
}
function convert(evt){
  convert_img(evt.target)
}
function reload_image(){
  convert_img(currentImage)
}
function convert_img(img){
  currentImage=img
  var canvas = document.getElementById("original")
  var ctx=original.getContext("2d")
  var w = dest_width.value?parseInt(dest_width.value):64
  var h = dest_height.value?parseInt(dest_height.value):64
  canvas.width=w;
  canvas.height=h;
  ctx.clearRect(0,0,w,h)
  if(background.value>=0){
    ctx.fillStyle=background.value==0?"black":"white"
    ctx.fillRect(0,0,w,h)
  }

  var ratio=img.width/img.height
  var hr=h/img.height
  var wr=w/img.width
  var nw=w;
  var nh=h;
  var offsetx=0;
  var offsety=0;
  if(fit_to_canvas_ms.value==0){
    //meet
    if(wr<=hr){
      nw=w;
      nh=nw/ratio
      switch(parseInt(fit_to_canvas_y.value)){
        case 0:
        offsety=(h-nh)/2
        break
        case 1:
        offsety=0
        break
        case 2:
        offsety=h-nh
        break
      }
    }else{
      nh=h;
      nw=nh*ratio
      switch(parseInt(fit_to_canvas_x.value)){
        case 0:
        offsetx=(w-nw)/2
        break
        case 1:
        offsetx=0
        break
        case 2:
        offsetx=w-nw
        break
      }
    }
  }else{
    //slice
    if(wr<=hr){
      nh=h;
      nw=nh*ratio
      var offsetx=0;
      switch(parseInt(fit_to_canvas_x.value)){
        case 0:
        offsetx=(w-nw)/2
        break
        case 1:
        offsetx=w-nw
        break
        case 2:
        offsetx=0
        break
      }
    }else{
      nw=w;
      nh=nw/ratio
      var offsety=0;
      switch(parseInt(fit_to_canvas_y.value)){
        case 0:
        offsety=(h-nh)/2
        break
        case 1:
        offsety=h-nh
        break
        case 2:
        offsety=0
        break
      }
    }
  }

  ctx.drawImage(img,offsetx,offsety,nw,nh)
  convertToGreyscale()
}
function setPixelValue(image,index,value){
  image.data[index]=value
  image.data[index+1]=value
  image.data[index+2]=value
}
function convertToGreyscale(){
  var contrast= parseInt(document.getElementById("contrast").value)
  var amt= parseInt(document.getElementById("light").value)
  var factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  var NumberOfShades=shades.value?parseInt(shades.value):8
  var canvas = document.getElementById("original")
  var ctx=original.getContext("2d")
  var grey_canvas = document.getElementById("grey_canvas")
  var g_ctx=grey_canvas.getContext("2d")
  var w = dest_width.value?parseInt(dest_width.value):64
  var h = dest_height.value?parseInt(dest_height.value):64
  grey_canvas.width=w;
  grey_canvas.height=h;
  var d = ctx.getImageData(0,0,w,h)
  var greyImage = g_ctx.createImageData(w, h);
  greyImage.data.set(d.data)
  for(var i=0;i<d.data.length;i+=4){
    var r=d.data[i]
    var g=d.data[i+1]
    var b=d.data[i+2]
    var gr = lumifunc[luminance.value](r,g,b)
    var f = 255 / (NumberOfShades - 1)
    var avggr = lumifunc[luminance.value](r,g,b)
    var gr = Math.round((avggr / f) + 0.5) * f
    gr+=amt
    gr=factor * (gr   - 128) + 128
    setPixelValue(greyImage,i,gr)
  }
  g_ctx.clearRect(0,0,w,h)
  g_ctx.putImageData(greyImage,0,0)
  convertToBW()
}

var lumifunc=[
  (r,g,b)=>Math.round((r+g+b)/3),
  (r,g,b)=>Math.round(r*0.3+g*0.59+b*0.11),
  (r,g,b)=>(Math.min(r,g,b)+Math.max(r,g,b))/2,
  (r,g,b)=>r,
  (r,g,b)=>g,
  (r,g,b)=>b,
]


function convertToBW(){

  var bw_image_buffer=[]
  var bw_error_buffer=[]

  var bw_canvas = document.getElementById("bw_canvas")
  var bw_ctx=bw_canvas.getContext("2d")
  var grey_canvas = document.getElementById("grey_canvas")
  var g_ctx=grey_canvas.getContext("2d")
  var w = dest_width.value?parseInt(dest_width.value):64
  var h = dest_height.value?parseInt(dest_height.value):64
  for(var x=0;x<w;x++){
    bw_error_buffer[x]=new Array(h)
    for(var y=0;y<h;y++){
      bw_error_buffer[x][y]=0
    }
  }
  bw_canvas.width=w;
  bw_canvas.height=h;
  var d = g_ctx.getImageData(0,0,w,h)
  var bwImage = bw_ctx.createImageData(w, h);
  bwImage.data.set(d.data)
  var bit=inverted.checked
  //var g2d=convert4To1(d.data,w,h)
  var cut=cutoff.value
  for(var y=0;y<h;y++){
    for(var x=0;x<w;x++){
      var i = y*w*4+x*4
      var gr = d.data[i]
      var cv=gr+bw_error_buffer[x][y]
      var err=0
      if(gr>cut){
        if(cv>cut){
          setPixelValue(bwImage,i,255)
          bw_image_buffer.push(bit?0:1)
          err=cv-255
        }else{
          setPixelValue(bwImage,i,0)
          bw_image_buffer.push(bit?1:0)
          err=cv
        }
      }else{
        if(cv<cut){
          setPixelValue(bwImage,i,0)
          bw_image_buffer.push(bit?1:0)
          err=cv
        }else{
          setPixelValue(bwImage,i,255)
          bw_image_buffer.push(bit?0:1)
          err=cv-255
        }
      }
      var ce=err/8
      dither(x,y,w,h,err,bw_error_buffer,kernels[dithering.value])
      // if((x+1)<w) bw_error_buffer[x+1][y]=ce*3
      // if((y+1)<h) bw_error_buffer[x][y+1]=ce*3
      // if((y+1)<h && (x+1)<w)  bw_error_buffer[x+1][y+1]=ce*2
    }

  }

  bw_ctx.putImageData(bwImage,0,0)
  screen.loadImage(bw_image_buffer)
  screen.toCanvas(res_canvas)
}
 var kernels=[
   {
    name:"none",
    devisor:1,
    defusor:[]
   },
   {
    name:"linear",
    devisor:1,
    defusor:[{x:1,y:0,f:1}]
   },
  {
   name:"fake_floyd",
   devisor:8,
   defusor:[{x:1,y:0,f:3},{x:0,y:1,f:3},{x:1,y:1,f:2}]
  },
  {
   name:"floyd_steinberg",
   devisor:16,
   defusor:[{x:1,y:0,f:7},{x:-1,y:1,f:3},{x:0,y:1,f:5},{x:1,y:1,f:1}]
  },
  {
   name:"jarvis_judice_ninke",
   devisor:48,
   defusor:[{x:1,y:0,f:7},{x:2,y:0,f:5},
     {x:-2,y:1,f:3},{x:-1,y:1,f:5},{x:0,y:1,f:7},{x:1,y:1,f:5},{x:2,y:1,f:3},
     {x:-2,y:2,f:1},{x:-1,y:2,f:3},{x:0,y:2,f:5},{x:1,y:2,f:3},{x:2,y:2,f:1}]
  },
  {
   name:"stucki",
   devisor:42,
   defusor:[{x:1,y:0,f:8},{x:2,y:0,f:4},
     {x:-2,y:1,f:2},{x:-1,y:1,f:4},{x:0,y:1,f:8},{x:1,y:1,f:4},{x:2,y:1,f:2},
     {x:-2,y:2,f:1},{x:-1,y:2,f:2},{x:0,y:2,f:4},{x:1,y:2,f:2},{x:2,y:2,f:1}]
  },
  {
   name:"atkinson",
   devisor:8,
   defusor:[{x:1,y:0,f:1},{x:2,y:0,f:1},
     {x:-1,y:1,f:1},{x:0,y:1,f:1},{x:1,y:1,f:1},
     {x:0,y:2,f:1}]
  },
  {
   name:"sierra",
   devisor:32,
   defusor:[{x:1,y:0,f:5},{x:2,y:0,f:3},
     {x:-2,y:1,f:2},{x:-1,y:1,f:4},{x:0,y:1,f:5},{x:1,y:1,f:4},{x:2,y:1,f:2},
     {x:-1,y:2,f:2},{x:0,y:2,f:3},{x:1,y:2,f:2}]
  },
  {
   name:"sierra 2-row",
   devisor:16,
   defusor:[{x:1,y:0,f:4},{x:2,y:0,f:3},
     {x:-2,y:1,f:1},{x:-1,y:1,f:2},{x:0,y:1,f:3},{x:1,y:1,f:2},{x:2,y:1,f:1}]
  },
  {
   name:"sierra light",
   devisor:4,
   defusor:[{x:1,y:0,f:2},
     {x:-1,y:1,f:1},{x:0,y:1,f:1}]
  }
]


function dither(x,y,w,h,e,eb,kernel){
  var err = e/kernel.devisor
  kernel.defusor.forEach(item=>{
    if((x+item.x)>=0 && (x+item.x)<w && (y+item.y)>=0 && (y+item.y)<h){
      eb[x+item.x][y+item.y]=err*item.f
    }
  })
}





function deleteImage(evt){
  var index=evt.target.getAttribute("data-listindex")
  imageList.splice(index,1)
  localStorage.setItem("imageList",JSON.stringify(imageList))
  refreshImageList()
}
function loadImageList(){
  if (storageAvailable('localStorage')) {
    if(!localStorage.getItem('imageList')){
      initStorage()
    }
    refreshImageList()
  }
  else {
    alert("Local Storage not available")
  }
}
function saveImageData(data){
  if (storageAvailable('localStorage')) {
    if(!localStorage.getItem('imageList')){
      initStorage()
    }
    imageList.unshift(data)
    localStorage.setItem("imageList",JSON.stringify(imageList))
    refreshImageList()
  }
  else {
    alert("Local Storage not available")
  }
}
function toClipboard(){
  output.select()
  document.execCommand("Copy");
}
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}
