# vzamemo node alpine image
FROM node:20-alpine     
WORKDIR /server 

# Kopiramo package.json in package-lock.json
COPY package*.json .   

# Namestimo odvisnosti
RUN npm install      

# Kopiramo ostale fajle
COPY . .         

# Izpostavimo port 5000, ubistvu samo deklaracija, ker bo port mapiran v docker-compose.yml
EXPOSE 5000

# Zaženemo aplikacijo, cmd je default command ki se izvede ko se container zažene
CMD npm start       