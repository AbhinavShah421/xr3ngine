import app from '../../app'

describe('\'Upload\' service', () => {
  it('registered the service', () => {
    const service = app.service('upload')
    expect(service).toBeTruthy()
  })
})