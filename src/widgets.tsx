import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import { ISubmissionState } from './serverextension';

export class ConfirmWidget extends ReactWidget {
  code: string;

  constructor(code: string) {
    super();
    this.code = code;
    this.addClass('jp-ReactWidget');
  }

  render() {
    return (
      <div className="assemble-featureSubmittedConfirm">
        <p>
          {' '}
          The following feature would be submitted to the upstream Ballet
          project:{' '}
        </p>
        <div>
          <pre>
            <code>{this.code}</code>
          </pre>
        </div>
      </div>
    );
  }
}

type IStateDetails = { [k in keyof ISubmissionState]: JSX.Element | string };

const stateDetails: IStateDetails = {
  check: '🔍Checking for valid code',
  fork: '🔱Forking upstream repository',
  clone: '📥Cloning repository',
  configure: '🛠️Configuring repository',
  branch: '🌳Creating new branch',
  feature: '✨Starting new feature',
  write: '✒️Adding code content',
  commit: '💍Committing new feature',
  push: '📤Pushing to remote',
  pullrequest: '🙋🏽‍♂️Creating pull request'
};

export class FeatureSubmissionStateWidget extends ReactWidget {
  set submissionState(submissionState: ISubmissionState) {
    this.stateSignal.emit(submissionState);
  }

  private spinner: JSX.Element = (
    <span className="spinner">
      <span className="spinnerContent" />
    </span>
  );

  private renderListDetails(submissionState: ISubmissionState): JSX.Element[] {
    return (Object.entries(stateDetails) as [
      keyof IStateDetails,
      string
    ][]).map(([k, v]) => (
      <p
        key={k}
        style={{
          lineHeight: 2,
          visibility: submissionState[k] == null ? 'hidden' : 'visible'
        }}
      >
        {v}... {submissionState[k] ? '✔️' : this.spinner}
      </p>
    ));
  }

  protected render(): JSX.Element {
    return (
      <div className="assemble-featureSubmissionState">
        <p> Your feature is being submitted... </p>
        <br />
        <div>
          <UseSignal signal={this.stateSignal} initialArgs={{}}>
            {(_, submissionState) => this.renderListDetails(submissionState)}
          </UseSignal>
        </div>
      </div>
    );
  }

  private stateSignal = new Signal<this, ISubmissionState>(this);
}

export class FeatureSubmittedOkayWidget extends ReactWidget {
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    this.addClass('jp-ReactWidget');
  }

  render() {
    return (
      <div className="assemble-featureSubmittedOkay">
        <p> Your feature was submitted! </p>
        <br />
        <p>
          {' '}
          The associated pull request is visible at{' '}
          <a href={this.url} target="_blank">
            {this.url}
          </a>
          . <span className="spinner"></span>
        </p>
        <br />
        <p> Please do not submit this same feature more than once. </p>
      </div>
    );
  }
}
