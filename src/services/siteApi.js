import axios from 'axios';

const authorization = process.env.API_TOKEN;

const instance = axios.create({

  baseURL: 'https://vr.sistemium.com/api',
  timeout: 10000,
  headers: {
    'X-Page-Size': 10000,
    authorization,
  },

});

instance.interceptors.response.use(({ data }) => data);

export default instance;
