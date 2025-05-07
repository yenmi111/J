# 使用官方 Node.js 映像
FROM node:20

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝 npm 套件
RUN npm install

# 複製專案所有檔案
COPY . .

# 對外開放的 port
EXPOSE 3000

# 啟動指令
CMD ["node", "server.js"]
