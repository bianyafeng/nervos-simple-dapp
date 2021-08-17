import Web3 from 'web3';
import * as DonationJSON from '../../../build/contracts/Donation.json';
import { Donation } from '../../types/Donation';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class DonationWrapper {
    web3: Web3;

    contract: Donation;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(DonationJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }
    
    async getBalance(fromAddress:string)
    {
    	 const data = await this.contract.methods.getBalance().call({ from: fromAddress });
	 return parseInt(data, 10);
    }
	
	async makeDonation(value:number,fromAddress:string)  {
	
	const tx = await this.contract.methods.makeDonation(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress,
            value
        });

        return tx;
	}

   async withdrawBalance(fromAddress:string)  {
	
	const tx = await this.contract.methods.withdrawBalance().send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
            
        });

        return tx;
	}


    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: DonationJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
