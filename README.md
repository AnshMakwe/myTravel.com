
# MyTravel.com– Blockchain based ticket management system

MyTravel.com is blockchain based ticket management built for customers and travel agencies
The system integrates Hyperledger Fabric technology as the core backend



## Prerequisites

1. Install Docker and Docker Compose.
2. Install Node.js (v14+ recommended) and npm.
3. Install Hyperledger Fabric binaries and samples.
4. Set up Firebase for authentication and Firestore for user data storage.
## Installation

To install the above mentioned prerequisites, use:

### Update and upgrade your system:
```bash
  ssudo apt update
  sudo apt upgrade -y
```

### Install cURL (if not already installed):
```bash
  sudo apt-get install curl -y
```

### Install Docker and Docker Compose (if not already installed):
```bash
  sudo apt install docker
  sudo apt install docker-compose 
```
### Verify Docker is installed:
```bash
  docker --version
  docker-compose --version
```
### Add the current user to the Docker group:
```bash
  sudo usermod -aG docker $USER
```
### Install Node.js and npm using package manager:
```bash
  sudo apt install nodejs npm
```
### Check installed version:
```bash
  node -v
  npm -v
```
### Install nodemon globally:
```bash
  sudo npm install -g nodemon
```





    
## Deployment

### To deploy this project

Clone the myTravel.com repository

Open myTravel.com folder and run:
```bash
  npm install
```


Navigate to chaincode/contract/javascript
Then run:
```bash
  npm install
  npm install luxon
```

### Navigate to sdk/javascript and run:
```bash
  npm install
  cd ..
```

## Initial Setup:

## Tear down any existing network
```bash
  sudo ./networkDown.sh
```

### For fabric network setup run:
```bash
  ./first.sh javascript
```
### Network Down and Docker Cleanup:
If the network is already running and you need to bring it down before re-deploying
Run the following command to stop the network:
```bash
  sudo ./networkDown.sh
```
### Clean up Docker containers:
```bash
  sudo docker container prune-f
```

## Subsequent Upgrades:
### Keep the network running, avoid networkDown.sh so that wallets, ledger state and peers remain intact


### Deploy new chaincode version using:
```bash
  ./second.sh javascript
```



### Backend Deployment:
Navigate to backend folder backend/ and run:
```bash
  npm install
  npm install dotenv
```
to install dependencies

### Launch the server:
```bash
  nodemon server.js
```

### Frontend Deployment:
In a seperate terminal navigate to the client folder client/ and run:
```bash
  npm install
```
to install dependencies

### Start the development server:
```bash
  npm start
```
### Once the client starts, the My Ticket website will be accessible at localhost:3000.




