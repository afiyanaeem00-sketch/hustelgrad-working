#-------------------------Frontend Dcokerfile by Nitin ----------------------

#---------------------------------- stage 1 ---------------------------------
 
# downlaod the base image 
FROM  node:20-alpine AS build

#making the work directory
WORKDIR /app

# copy the package 
COPY package*.json ./

#install the npm 
RUN npm install

# copy all code form local host to other
COPY . .

# Vite production build create karo (dist folder banega)
RUN npm run build

#----------------------------------- stage 2 ---------------------------------

FROM nginx:alpine

# Custom Nginx config file copy karo (React routing ke liye)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Stage 1 se built static files Nginx web folder mein copy karo
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx port expose karo
EXPOSE 100

# Nginx server start karo
CMD ["nginx", "-g", "daemon off;"]
