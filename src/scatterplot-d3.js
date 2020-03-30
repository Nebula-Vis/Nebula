
// 之前大概写的代码，后面用到的时候封装一下，还不能直接用
const svg1 = d3.select('#chart1').append('svg').attr('width', 320).attr('height', 320).attr('transform', 'translate(20, 20)')

const domain = [[0, 25], [0, 25]]
const range = [[20, 300], [300, 20]]
const x1 = d3.scaleLinear().domain(domain[0]).range(range[0])
svg1.append('g').attr("transform", "translate(0, 300)").call(d3.axisBottom(x1))
const y1 = d3.scaleLinear().domain(domain[1]).range(range[1])
svg1.append('g').attr("transform", "translate(20, 0)").call(d3.axisLeft(y1))

const circles = svg1.selectAll('circle').data(data)
  .enter().append('circle').attr('cx', d => x1(d.a)).attr('cy', d => y1(d.b)).attr('r', 4).style('fill', '#69b3a2')

let selection = []

const brushCb = () => {
  const range = d3.event.selection
  circles.style('fill', d => {
    if (x1(d.a) >= range[0][0] && x1(d.a) <= range[1][0] && y1(d.b) >= range[0][1] && y1(d.b) <= range[1][1])
      return '#69b3a2'
    else  
      return '#aaa'
  })
  selection = data.filter(d => {
    return x1(d.a) >= range[0][0] && x1(d.a) <= range[1][0] && y1(d.b) >= range[0][1] && y1(d.b) <= range[1][1]
  })
}
svg1.call(d3.brush().extent([[20, 20], [300, 300]]).on('brush', brushCb))