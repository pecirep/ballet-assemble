import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

export interface ISubmissionRequest {
  codeContent: string;
}

export interface ISubmissionState {
  load?: boolean;
  check?: boolean;
  fork?: boolean;
  clone?: boolean;
  configure?: boolean;
  branch?: boolean;
  feature?: boolean;
  write?: boolean;
  commit?: boolean;
  push?: boolean;
  pullrequest?: boolean;
  url?: string;
}

export interface ISubmissionResponse {
  result: boolean;
  state?: ISubmissionState;
  url?: string;
  message?: string;
  tb?: string;
}

export interface IAuthenticatedResponse {
  result: boolean;
}

interface IFeatureInfo {
  name: string;
  inputs: string[];
  author: string;
}

interface IFeatureInfoResponse {
  [featureId: string]: IFeatureInfo;
}

interface IFeatureInputResult {
  [featureId: string]: string[];
}

interface IFeatureInputError {
  message: string;
  tb: string;
}

type IFeatureInputResponse = { result: IFeatureInputResult } | IFeatureInputError;

export async function submit(
  cellContents: string
): Promise<ISubmissionResponse> {
  const endPoint = 'submit';
  const init = {
    method: 'POST',
    body: JSON.stringify({
      codeContent: cellContents
    })
  };

  try {
    return request<ISubmissionResponse>(endPoint, init);
  } catch (error) {
    console.error(error);
    return { result: false };
  }
}

export async function getExistingFeatures(): Promise<IFeatureInfoResponse> {
  return request<IFeatureInfoResponse>('features');
}

export async function getExistingFeatureCode(featureId: string) {
  const response = await request<{ code: string }>(`features/${featureId}`);
  return response.code;
}

export function getNewFeatureInputs(
  cellContents: string
): Promise<IFeatureInputResponse> {
  return request<IFeatureInputResult>('inspect', {
    method: 'POST',
    body: JSON.stringify({
      codeContent: cellContents
    })
  }).then(result => ({ result })).catch((error: ServerConnection.ResponseError) => {
    console.error(error);
    return {
      message: error.message,
      tb: error.traceback
    };
  });
}

export async function getSubmission(): Promise<ISubmissionResponse> {
  try {
    return request<ISubmissionResponse>('submit');
  } catch (error) {
    console.error(error);
    return { result: false };
  }
}

export async function checkStatus(): Promise<void> {
  return request<void>('status');
}

export async function isAuthenticated(): Promise<boolean> {
  const response = await request<IAuthenticatedResponse>('auth/authenticated');
  return response.result;
}

export function getEndpointUrl(endPoint: string): string {
  const settings = ServerConnection.makeSettings();
  return URLExt.join(settings.baseUrl, 'assemble', endPoint);
}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function request<T>(
  endPoint: string = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const requestUrl = getEndpointUrl(endPoint);

  let response: Response;
  try {
    const settings = ServerConnection.makeSettings();
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message);
  }

  return data;
}
