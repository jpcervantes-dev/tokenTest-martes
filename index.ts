// Realizamos la importaciones necesarias de @solana/web3.js y @solana/spl-token

import { clusterApiUrl, 
    Connection, 
    Keypair, 
    sendAndConfirmTransaction, 
    Transaction 
    } from '@solana/web3.js';
import { createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    createMintToCheckedInstruction, 
    createTransferInstruction 
    } from '@solana/spl-token'; 

// Aquí declaro las constantes a utilizar:
// fromKey  ->  wallet de origen:   DYTtmPGLijiGG6muwx1sHbP73tUobm55qigJ7BjPVWgW
// toKey    ->  wallet de destino:  FVFPDJvHTGTW2j9WArTLJfBVAeWbJ42ysMSuKDpScKiB
// tokensToGenerate y tokensToTransfer son los tokens a generar y los que se transferirán, respectivamente. 
const fromKey: Uint8Array = Uint8Array.from([82, 159, 117, 212, 205, 62, 24, 216, 31, 133, 82, 110, 84, 227, 126, 86, 29, 128, 166, 31, 252, 34, 230, 36, 79, 233, 112, 239, 119, 195, 71, 96, 186, 91, 167, 216, 155, 86, 248, 7, 52, 140, 252, 227, 78, 242, 204, 157, 120, 242, 61, 211, 107, 151, 83, 111, 94, 192, 150, 66, 127, 62, 214, 135]);
const toKey: Uint8Array = Uint8Array.from([23, 235, 1, 223, 209, 184, 133, 228, 245, 9, 108, 187, 49, 176, 4, 185, 207, 105, 254, 35, 108, 129, 1, 70, 126, 194, 153, 136, 4, 83, 134, 50, 215, 64, 36, 122, 197, 118, 119, 143, 229, 159, 246, 186, 156, 180, 150, 251, 211, 61, 152, 82, 208, 228, 8, 208, 28, 255, 88, 226, 61, 124, 78, 68]);

const tokensToGenerate = 999;
const tokensToTransfer = 333;

// Declaramos la función asíncrona donde todo se va a ejecutar. 
(async () => {
    // Creamos la conexión al cluster, en este caso apunta a devnet para realizar las pruebas.
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // En este caso apuntamos a dos wallets que generamos previamente (FromWallet y ToWallet)
    // La primera es el origen, la segunda es el destino.
    const FromWallet_Key = Keypair.fromSecretKey(fromKey);
    const ToWallet_Key = Keypair.fromSecretKey(toKey);

    // Asignamos a la variable mint el "esqueleto" del token.  
    // Lleva por parámetros:
    const mint = await createMint(
        connection,                 // conexión
        FromWallet_Key,             // pagador
        FromWallet_Key.publicKey,   // autoridad de minteo
        null,                       // autoridad de freeze 
        0                           // número de decimales que tendrán los tokens
    );

    // Aquí buscamos obtener la dirección de la cuenta de los tokens creada, en caso de no existir la crea.
    // en el primer caso el propietario será la wallet de origen y en el segundo la wallet de destino.
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,                 // conexión
        FromWallet_Key,             // pagador
        mint,                       // dirección del minteo
        FromWallet_Key.publicKey    // propietario
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,                 // conexión
        FromWallet_Key,             // pagador
        mint,                       // dirección del minteo
        ToWallet_Key.publicKey);    // propietario

    // const mintchecked = createMintToCheckedInstruction(mint, fromTokenAccount.address, FromWallet_Key.publicKey, 100, 0)

    // Realizamos el minteo de las tokens en la cuenta de origen. 
    // los parámetros son: 
    let signature = await mintTo(
        connection,                 // conexión
        FromWallet_Key,             // pagador
        mint,                       // dirección del mint
        fromTokenAccount.address,   // destino
        FromWallet_Key,             // autoridad, debe ser firmante
        tokensToGenerate           // cantidad de Tokens a crear
        // [FromWallet_Key]
    );

        // Ahora procedemos a generar una instrucción para poder realizar la transferencia.
    const instruction = createTransferInstruction(
        fromTokenAccount.address,   // Origen
        toTokenAccount.address,     // Destino
        FromWallet_Key.publicKey,   // Propietario
        tokensToTransfer,           // Cantidad de tokens a transferir
        // [FromWallet_Key]
        );

        // Generamos una nueva transacción y le añadimos la instrucción
    let trans = new Transaction().add(instruction)

        // Finalmente enviamos y confirmamos la transacción
    const response = await sendAndConfirmTransaction(
        connection,         // conexión
        trans,              // transacción con instrucciones
        [FromWallet_Key])      // Firmantes

        // Log para corroborar las variables. 
    console.log(
    `\tFromWallet_Key: \t${FromWallet_Key.publicKey}
    Token amount to mint: \t${tokensToGenerate}
    mint account: \t\t${mint}
    Tokens amount to transfer: \t${tokensToTransfer}
    mint tx: \t\t\t${signature}
    transaction tx: \t\t${response}
    fromTokenAccount: \t\t${fromTokenAccount.address}
    toTokenAccount: \t\t${toTokenAccount.address}
    `)
})();
