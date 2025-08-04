import {apiClient} from '../client';

export const userApi = {
    createUser: (data: any):Promise<any> =>
        apiClient.post('api/v1/users', data),
    getUsers: (data: any) =>
        apiClient.post('api/v1/users/list', data),
    deleteUser: (endPoint:string) =>
        apiClient.delete(`api/v1/users/${endPoint}`),
};