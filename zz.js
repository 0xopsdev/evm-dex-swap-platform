const { ethers } = require('ethers');

async function main() {
    const creationCode = '...';

    const strippedCreationCode = creationCode.substring(2);
    const routerAddressHex = strippedCreationCode.slice(-40);
    const routerAddress = ethers.utils.getAddress('0x' + routerAddressHex);

    console.log('Router address used during deployment:', routerAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//verify teh router address 
