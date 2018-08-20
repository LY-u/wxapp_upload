
import YX from './sdk'
let userId = wx.getStorageSync('userId')
let token = wx.getStorageSync('accessToken')
const http = new YX(userId, token)

let upng = require('./UPNG')

let canvasId = 'pickImg'

export function imgUpload(callback){
  wx.chooseImage({
    count: 1, // 默认9
    sizeType: ['compressed'],   // 'original', 'compressed'
    sourceType: ['album', 'camera'],
    success: (res) => {
      // console.log(res)
      res.tempFiles.map(i=>{
        let size = i.size
        if (size > 5 * 1024 * 1024 * 1024) {
          return wx.showToast({ title: '图片过大', icon: 'none' })
        }else{
          toCanvas(i.path, callback)
        }
      })
      
    }
  })
}
function toCanvas(file,callback){
  wx.showLoading()
  let temp = file
  let name = getName(file)
  let canvas = wx.createCanvasContext(canvasId)
  const platform = wx.getSystemInfoSync().platform
  wx.getImageInfo({
    src: temp,
    success: res => {
      let tr_width = res.width
      let tr_height = res.height
      let ad_width = wx.getSystemInfoSync().windowWidth
      let ad_height = ad_width * tr_height / tr_width

      let imgWidth = tr_width > ad_width ? ad_width : tr_width
      let imgHeight = tr_width > ad_width ? ad_height : tr_height
      
      // console.log(imgWidth, imgHeight)
      canvas.drawImage(temp, 0, 0, imgWidth, imgHeight)
      canvas.draw(false, () => {
        wx.canvasGetImageData({
          canvasId: canvasId,
          x: 0,
          y: 0,
          width: imgWidth,
          height: imgHeight,
          success(res) {
            if (platform === 'ios') {
              // 兼容处理：ios获取的图片上下颠倒 
              res = reverseImgData(res)
            } 
            //  png编码
            let pngData = upng.encode([res.data.buffer], res.width, res.height)
            //  base64编码
            let base64 = wx.arrayBufferToBase64(pngData)
            // console.log(base64)
            let { promise } = http.imgUpload(name, base64)
            promise.then((res) => {
              // console.log(res)
              let filePath = res.filePath
              wx.hideLoading()
              callback && callback(filePath)
            }).catch(e=>{
              console.log(e)
              wx.hideLoading()
            })
          }
        })
      })
    }
  })
}
function getType(url){
  if (!url) return ''
  let arr = url.split('.')
  if (arr.length > 1) {
    return arr[arr.length - 1]
  }
  return ''
}
function getName(url) {
  if (!url) return ''
  let arr = url.split('/')
  if (arr.length >= 1) {
    return arr[arr.length - 1]
  }
  return 'none.png'
}

function reverseImgData(res) {
  var w = res.width
  var h = res.height
  let con = 0
  for (var i = 0; i < h / 2; i++) {
    for (var j = 0; j < w * 4; j++) {
      con = res.data[i * w * 4 + j]
      res.data[i * w * 4 + j] = res.data[(h - i - 1) * w * 4 + j]
      res.data[(h - i - 1) * w * 4 + j] = con
    }
  }
  return res
}