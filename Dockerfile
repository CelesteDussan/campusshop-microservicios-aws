FROM node:24.13.1-alpine
WORKDIR /app
COPY --chown=node:node shared ./shared
COPY --chown=node:node services ./services
COPY --chown=node:node gateway ./gateway
COPY --chown=node:node frontend ./frontend
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","gateway/main.mjs"]
