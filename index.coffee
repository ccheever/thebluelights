__doc__ = """
A module for turning off and on the lights in the apartment at 101 Alma St.

"""

{
  isBoolean
  isNumber
} = require 'lodash-node'
radiora2 = require 'radiora2'

class LutronClient
  constructor: (opts) ->

    { host, username, password } = opts ? {}
    @_host = host ? '192.168.1.201'
    @_username = username ? 'lutron'
    @_password = password ? 'integration'
    @_client = new radiora2.RadioRa2 @_host, @_username, @_password

  connect: ->
    @_client.connect()

  charliesRoomLights: (x) ->

    if isBoolean x
      if x
        @_client.pressButton 24, 2
      else
        @_client.pressButton 24, 4

    else if isNumber x
      @_client.setDimmer 20, x

    else
      throw new Error "number or boolean required"

  allLights: (x) ->
    if x isBoolean
      if x
        @_client.pressButton 32, 1
      else
        @_client.pressButton 32, 2
    else
      throw new Error "boolean required"

  commonAreaLights: (x) ->
    if x isBoolean
      if x
        @_client.pressButton 32, 3
      else
        @_client.pressButton 32, 4
    else
      throw new Error "boolean required"


#coffee*> RECEIVED>>~DEVICE,32,4,3 -- common lights off
# RECEIVED>>~DEVICE,32,2,3 -- all lights off
# coffee*> RECEIVED>>~DEVICE,24,4,3 -- my lights off

#RECEIVED>>~DEVICE,24,2,3 -- my lights on
#~OUTPUT,20,1,100.00
#RECEIVED>>~DEVICE,32,82,9,0

# Set my lights thebluelights._client.setDimmer(20,10)

module.exports = {
  LutronClient
  __doc__
}
