/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { DonationWrapper } from '../lib/contracts/DonationWrapper';
import { CONFIG } from '../config';
import {SudtERC20Wrapper} from "../lib/contracts/ERC20Wrapper";



async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<DonationWrapper>();
    const [ckETHContract,setckETHContract]=useState<SudtERC20Wrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [balanceValue, setbalanceValue] = useState<number | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [polyjuiceBalance, setPolyjuiceBalance] = useState<string>();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    
     useEffect( () => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
            
       
        } else {
            setPolyjuiceAddress(undefined);
         
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new DonationWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );

        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getBalance() {
        const value = await contract.getBalance(account);
        setbalanceValue(value);
   
    }

    






    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new DonationWrapper(web3);
        const _ckETHContract=new SudtERC20Wrapper(web3);
        const addressTranslator=new AddressTranslator();

         _contract.useDeployed(contractAddress.trim());

        
        _ckETHContract.useDeployed("0x99ea8175C142D99eBF1D972B213ccb82134742C7");
        
        const depositAddress = await addressTranslator.getLayer2DepositAddress(web3, account);
        const _ckEthBalance = await _ckETHContract.balanceOf(polyjuiceAddress, account);
        
        setContract(_contract);  
        setckETHContract(_ckETHContract);
        setStoredValue(undefined);
        setDepositAddress(depositAddress.addressString);
       
        const updateBalances=async()=>
        {
            const _ckEthBalance = await _ckETHContract.balanceOf(polyjuiceAddress, account);
            setPolyjuiceBalance(formatNumber( _ckEthBalance.toString(),18));
        
            const _l2Balance = BigInt(await web3.eth.getBalance(account));
            setL2Balance(_l2Balance);
            setTimeout(updateBalances,10000);
        }
        updateBalances();
        
        
    }

    async function makeDonation() {
        try {
            setTransactionInProgress(true);
            await contract.makeDonation(newStoredNumberInputValue, account);
            toast(
                'Thank you for your donation!;)',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            await getBalance();
            setTransactionInProgress(false);
        }
    }


    async function withdrawBalance() {
        try {
            setTransactionInProgress(true);
            await contract.withdrawBalance(account);
            toast(
                'Successfully transfer the funds to your account.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            await getBalance();
            setTransactionInProgress(false);
        }
    }


    function formatNumber(number:string,ndecimals:number){
        if(number.length>ndecimals)
        {
           return number.substring(0,number.length-ndecimals)+"."+number.substring(number.length-ndecimals).replace(/0+/,"");
         }else
           {
             
             let nzeros=ndecimals-number.length;
             let newnumber="0."+String("0").repeat(nzeros)+number.replace(/0+/,"");;
             return newnumber;
           }
        
      }
      




    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Your Polyjuice cKETH balance: <b>{polyjuiceBalance || ' - '}</b>
            <br />
            <br />
            Layer 2 Deposit Address on Layer 1:<br/> <div  className="l2dAddress"><b>{depositAddress || ' - '}</b></div>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? formatNumber(l2Balance.toString(),8) : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />

           


            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <p><h3>Total funds in the contract:{balanceValue ? <>&nbsp;&nbsp;{balanceValue.toString()}</> : 0}</h3></p>
            <p>
                The button below will make a transfer to the contract address.You can withdraw the total funds in the contract from owner address. 
            </p>
            <input
                type="number" className="txtNumber"
                onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={makeDonation} disabled={!contract} className="appbtn">
                Make a Donation
            </button>
            <button onClick={withdrawBalance} disabled={!contract} className="appbtn">
                Withdraw Balance
            </button>
     
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
