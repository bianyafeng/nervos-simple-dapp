import Web3 from 'web3';
import * as SudtERC20JSON from '../../../build/contracts/ERC20.json';
import { ERC20 } from '../../types/ERC20'

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SudtERC20Wrapper {
    web3: Web3;

    contract: ERC20;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SudtERC20JSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async balanceOf(balancePolyjuiceAddress: string, fromAddress: string) {
        const data = await this.contract.methods.balanceOf(balancePolyjuiceAddress).call({ from: fromAddress });
        return parseInt(data, 10);
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}