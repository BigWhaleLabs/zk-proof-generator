import axios from 'axios'
import checkIfPrimary from '@/helpers/cluster/checkIfPrimary'

export const faddressToConnectedAddresses = {} as {
  [faddress: string]: string[]
}

export async function fetchConnectedAddress(address: string) {
  checkIfPrimary()
  const { data } = await axios.get<
    {
      connectedAddress: string
    }[]
  >(`https://searchcaster.xyz/api/profiles?address=${address}`)
  const connectedAddresses = data.map(
    ({ connectedAddress }) => connectedAddress
  )
  faddressToConnectedAddresses[address] = connectedAddresses
}

const step = 5
export async function fetchConnectedAddresses(addresses: string[]) {
  checkIfPrimary()
  for (let i = 0; i < addresses.length; i += step) {
    console.log(
      `Fetching connected addresses ${i} to ${i + step} / ${addresses.length}`
    )
    try {
      await Promise.all(
        addresses
          .slice(i, i + step)
          .map((address) => fetchConnectedAddress(address))
      )
    } catch (error) {
      console.error(
        'Error fetching connected addresses',
        error instanceof Error ? error.message : error
      )
      i -= step
    }
  }
}

export function isAddressConnected(address: string) {
  checkIfPrimary()
  const allConnectedAddresses = Object.values(faddressToConnectedAddresses)
    .reduce((acc, val) => acc.concat(val), [] as string[])
    .filter((v) => !!v)
    .map((s) => s.toLowerCase())
  return allConnectedAddresses.includes(address.toLowerCase())
}
