import Vue from 'vue/dist/vue.js'
import * as d3 from 'd3'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.chinatmsproviders'
import 'leaflet-draw/dist/leaflet.draw-src.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import turf from 'turf-inside'
import './map.css'

export default Vue.extend({
  name: 'Map',
  template: `
<div class="geomap-root">
  <div id="mapid" ref="map"></div>
</div>
  `,
  data() {
    return {
      mapData: [],
      selectedArea: {},
      encoding: {},
      svgWidth: 50,
      svgHeight: 50,
      brushEventFlag: false,
      map: null,
      points: [],
      pointsLayer: undefined,
      paramStore: undefined,
      clickArea: undefined,
      zoom: 13,
      brushIndices: [],
      clickedData: null,
      defaultEncoding: {
        x: undefined,
        y: undefined,
        color: undefined,
        size: undefined,
        brushType: 'xy',
        bottomEdge: 'bottom',
      },
    }
  },
  computed: {
    mergedEncoding() {
      return { ...this.defaultEncoding, ...this.encoding }
    },
    defaultStyle() {
      const xArr = d3.extent(this.mapData, (d) => {
        let result = d
        const keyArr = this.mergedEncoding.x.split('.')
        keyArr.forEach((item) => (result = result[item]))
        return result
      })
      const yArr = d3.extent(this.mapData, (d) => {
        let result = d
        const keyArr = this.mergedEncoding.y.split('.')
        keyArr.forEach((item) => (result = result[item]))
        return result
      })
      const centerPoint = [
        (Number(yArr[0]) + Number(yArr[1])) / 2,
        (Number(xArr[0]) + Number(xArr[1])) / 2,
      ]
      return {
        defaultMapStyle: {
          mapLayerStyle: 'Geoq.Normal.Gray', // 地图层风格
          annotionLayerStyle: null, // 注解层风格
          minZoom: 3, // 最小缩放倍数
          maxZoom: 20, // 最大缩放倍数
          centerPoint: centerPoint, // 中心点坐标，默认为所有点中心
          zoom: 10, // 初始缩放倍数
          zoomControl: false, // 是否有缩放控件
          attributionControl: false, // 是否有归因控件
        },
        circleColor: this.encoding.circleColor,
      }
    },
    mergedStyle() {
      return {
        mergedMapStyle: {
          ...this.defaultStyle.defaultMapStyle,
          ...this.encoding.mapStyle,
        },
        circleColor: this.encoding.circleColor
          ? this.encoding.circleColor
          : this.defaultStyle.circleColor,
      }
    },
  },
  watch: {
    mapData: function () {
      this.zoom = this.map.getZoom()
      if (this.points)
        this.points.forEach((item) => {
          item.remove()
        })
      if (!this.mapData) return
      this.points = this.drawCircle([])
    },
    selectedArea() {
      this.drawSelectedArea()
    },
  },
  created() {
    switch (this.axes) {
      case 'none':
        this.xAxisSpace = 0
        this.yAxisSpace = 0
        break
      case 'x':
        this.yAxisSpace = 0
        break
      case 'y':
        this.xAxisSpace = 0
        break
      default:
        break
    }
  },
  mounted() {
    const rect = this.$refs['map'].getBoundingClientRect()
    this.svgWidth = rect.width
    this.svgHeight = rect.height
    this.zoom = this.mergedStyle.mergedMapStyle.zoom
    this.brushEventFlag = true
    const { maxZoom, minZoom } = this.mergedStyle.mergedMapStyle
    const LayerCst = L.TileLayer.extend({
      initialize: function (url, options) {
        L.TileLayer.prototype.initialize.call(this, url, {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          key: '174705aebfe31b79b3587279e211cb9a',
          ...options,
        })
      },
    })
    let mapLayer = new LayerCst(this.mergedStyle.mergedMapStyle.mapLayerStyle, {
      maxZoom,
      minZoom,
    })
    if (!this.encoding.mapStyle.mapLayerStyle) {
      mapLayer = L.tileLayer.chinaProvider(
        this.mergedStyle.mergedMapStyle.mapLayerStyle,
        {
          maxZoom,
          minZoom,
        }
      )
    }
    const annotionLayer = new LayerCst(
      this.mergedStyle.mergedMapStyle.annotionLayerStyle,
      { maxZoom, minZoom }
    )
    const layers = [mapLayer, annotionLayer]
    const map = L.map(this.$refs.map, {
      minZoom: this.mergedStyle.mergedMapStyle.minZoom,
      maxZoom: this.mergedStyle.mergedMapStyle.maxZoom,
      center: this.mergedStyle.mergedMapStyle.centerPoint,
      zoom: this.mergedStyle.mergedMapStyle.zoom,
      zoomControl: this.mergedStyle.mergedMapStyle.zoomControl,
      attributionControl: this.mergedStyle.mergedMapStyle.attributionControl,
      crs: L.CRS.EPSG3857,
      renderer: L.svg(),
      dragging: true,
      layers: layers,
      deawControl: true,
    })
    this.map = map
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    this.drawnItems = drawnItems
    const self = this
    const options = {
      position: 'topleft',
      draw: {
        polyline: {
          shapeOptions: {
            color: d3.schemeSet3[2],
            weight: 10,
          },
        },
        polygon: {
          allowIntersection: false, //  Restricts shapes to simple polygons
          drawError: {
            color: '#e1e100', //  Color the shape will turn when intersects
            message: "<strong>Oh snap!<strong> you can't draw that!", //  Message that will show when intersect
          },
          shapeOptions: {
            color: d3.schemeSet3[2],
          },
          showArea: true,
          showLength: true,
        },
        rectangle: {
          shapeOptions: {
            clickable: false,
            color: d3.schemeSet3[4],
          },
        },
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems, // REQUIRED!!
        remove: true,
      },
    }
    const drawControl = new L.Control.Draw(options)
    map.addControl(drawControl)
    map.on(L.Draw.Event.DRAWSTART, function () {
      if (self.clickArea) self.clickArea.remove()
      if (self.pointsLayer) self.pointsLayer.remove()
      self.points = self.drawCircle(['grey'])
    })
    map.on(L.Draw.Event.CREATED, function (e) {
      const type = e.layerType
      const layer = e.layer
      if (type === 'marker') layer.bindPopup('A popup!')
      if (Object.prototype.toString.call(e.layer._latlngs) !== '[object Array]')
        return
      const selection = self.dealClickArea(e.layer._latlngs[0])
      self.$emit('selection', selection.selectedArr)
      self.$emit('selectedArea', {
        [self.mergedEncoding.y]: [
          e.layer._latlngs[0][3].lat,
          e.layer._latlngs[0][1].lat,
        ],
        [self.mergedEncoding.x]: [
          e.layer._latlngs[0][1].lng,
          e.layer._latlngs[0][3].lng,
        ],
      })
      if (self.pointsLayer) self.pointsLayer.remove()
      self.points = self.drawCircle([
        'grey',
        self.mapData,
        self.encoding.circleColor,
        selection.selectedArr,
      ])
      drawnItems.addLayer(layer)
      drawnItems.bringToFront()
      self.clickArea = layer
    })
    map.on(L.Draw.Event.DELETED, function () {
      if (self.pointsLayer) self.pointsLayer.remove()
      self.points = self.drawCircle([self.encoding.circleColor])
    })
    map.on('moveend', self.onMapPan)
    // map.on('move', self.onMapPan)

    self.points = this.drawCircle([])

    this.map.on('zoomend', function () {
      self.zoom = self.map.getZoom()
      if (self.points) {
        self.points.forEach((item) => {
          item.remove()
        })
      }
      self.points = self.drawCircle(self.paramStore)
    })
    this.drawSelectedArea()
    this.onMapPan()
  },
  methods: {
    drawSelectedArea() {
      if (this.clickArea) this.clickArea.remove()
      const point1 = this.map.containerPointToLatLng([0, 0])
      const point2 = this.map.containerPointToLatLng([
        this.svgWidth,
        this.svgHeight,
      ])
      const xRange = this.selectedArea[this.mergedEncoding.x]
      const yRange = this.selectedArea[this.mergedEncoding.y]
      if (!xRange && !yRange) return
      if (yRange) {
        point1.lat = yRange[0]
        point2.lat = yRange[1]
      }
      if (xRange) {
        point1.lng = xRange[0]
        point2.lng = xRange[1]
      }
      const layer = L.rectangle([point1, point2], {
        color: d3.schemeSet3[4],
      })
      layer.addTo(this.map)
      this.clickArea = layer
      const selection = this.dealClickArea([
        L.latLng(point1.lat, point1.lng),
        L.latLng(point1.lat, point2.lng),
        L.latLng(point2.lat, point2.lng),
        L.latLng(point2.lat, point1.lng),
      ])
      if (this.pointsLayer) this.pointsLayer.remove()
      this.points = this.drawCircle([
        'grey',
        this.mapData,
        this.encoding.circleColor,
        selection.selectedArr,
      ])
      // if (!this.selectedArea) {
      //   const parArr = [
      //     this.map.containerPointToLatLng([0, 0]),
      //     this.map.containerPointToLatLng([0, this.svgHeight]),
      //     this.map.containerPointToLatLng([this.svgWidth, this.svgHeight]),
      //     this.map.containerPointToLatLng([this.svgWidth, 0]),
      //   ]
      //   const dataInWindow = this.dealClickArea(parArr)
      //   this.$emit('selection', dataInWindow)
      // }
    },
    drawCircle([color, data, color1, data1]) {
      //  eslint-disable-next-line prefer-rest-params
      const usedData = arguments && data ? data : this.mapData
      if (!usedData) return undefined
      const mE = this.mergedEncoding
      const points = []
      usedData.forEach((item, key) => {
        let fillColor = color
          ? color
          : mE.color && item[mE.color]
          ? item[mE.color]
          : this.mergedStyle.circleColor
        if (data1 && data1.includes(item)) fillColor = color1
        const circle = L.circle(
          [this.deEncoding(item, mE.y), this.deEncoding(item, mE.x)],
          {
            color: 'white',
            fillColor: fillColor,
            fillOpacity: 1,
            //  radius: (item[mE.size] * Math.pow(2, 13-this.zoom)),
            radius: 80 * Math.pow(2, 13 - this.zoom),
            weight: 1,
          }
        )
        const circlePopup = circle.bindPopup(
          (() => {
            let result = '<b>'
            for (const i in item) result += `${i}: ${item[i]}<br>`
            result += '</b>'
            return result
          })()
        )
        circlePopup.on('popupopen', () => {
          if (!(this.clickedData === item)) {
            this.$emit('click', [item, key])
            this.clickedData = item
          }
        })
        points.push(circle)
      })
      this.pointsLayer = L.layerGroup(points)
      this.pointsLayer.addTo(this.map)
      // this.pointsLayer.bringToBack()
      this.paramStore = [color, data, color1, data1]
      return points
    },
    dealClickArea(latlngs) {
      const coordinates = latlngs.map((item) => {
        return [item.lng, item.lat]
      })
      const selectedPoly = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      }
      const selectedArr = []
      const processedData = []
      this.mapData.forEach((item) => {
        const tempCoordinates = [
          this.deEncoding(item, this.mergedEncoding.x),
          this.deEncoding(item, this.mergedEncoding.y),
        ]
        const tempPoint = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: tempCoordinates,
          },
        }
        if (turf(tempPoint, selectedPoly)) {
          selectedArr.push(item)
          processedData.push({
            x: tempCoordinates[1],
            y: tempCoordinates[0],
          })
        }
      })
      const selection = {
        processedData,
        coordinates,
        selectedArr,
      }
      return selection
    },
    enEncoding(value) {
      if (typeof value === 'string') return value.split('.')
      else return value
    },
    deEncoding(obj, key) {
      let keyArr = key
      if (typeof keyArr === 'string') keyArr = keyArr.split('.')
      let tempItem = obj
      keyArr.forEach((item) => {
        tempItem = tempItem[item]
      })
      return tempItem
    },
    onMapPan() {
      const parArr = [
        this.map.containerPointToLatLng([0, 0]),
        this.map.containerPointToLatLng([0, this.svgHeight]),
        this.map.containerPointToLatLng([this.svgWidth, this.svgHeight]),
        this.map.containerPointToLatLng([this.svgWidth, 0]),
      ]
      const dataInWindow = this.dealClickArea(parArr)
      this.$emit('visibleData', dataInWindow)
      this.$emit('visibleRange', {
        [this.mergedEncoding.y]: [parArr[2].lat, parArr[0].lat],
        [this.mergedEncoding.x]: [parArr[0].lng, parArr[2].lng],
      })
      this.drawSelectedArea()
    },
  },
})
