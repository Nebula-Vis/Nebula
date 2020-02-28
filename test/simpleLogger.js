const output = document.createElement('div')
document.querySelector('body').appendChild(output)

export default {
  warn: msg => {
    const p = document.createElement('p')
    p.innerHTML =
      'Warn: ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg)
    p.style.color = 'orange'
    output.appendChild(p)
  },
  error: msg => {
    const p = document.createElement('p')
    p.innerHTML =
      'Error: ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg)
    p.style.color = 'red'
    output.appendChild(p)
  },
  info: msg => {
    const p = document.createElement('p')
    p.innerHTML =
      'Info: ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg)
    p.style.color = '#777'
    output.appendChild(p)
  },
  log: msg => {
    const p = document.createElement('p')
    p.innerHTML =
      'Info: ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg)
    p.style.color = '#777'
    output.appendChild(p)
  },
}
