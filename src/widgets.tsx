import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';
import React from 'react';
import { ISubmissionState } from './serverextension';
import { checkCircle } from './icons';
import { Notebook } from '@jupyterlab/notebook';
import { createCellFromCode } from '.';

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
  check: '🔍 Checking for valid code',
  fork: '🔱 Forking upstream repository',
  clone: '📥 Cloning repository',
  configure: '🛠️ Configuring repository',
  branch: '🌳 Creating new branch',
  feature: '✨ Starting new feature',
  write: '✒️ Adding code content',
  commit: '💍 Committing new feature',
  push: '📤 Pushing to remote',
  pullrequest: '🙋🏽‍♂️ Creating pull request'
};

const spinner: JSX.Element = (
  <span className="spinner">
    <span className="spinnerContent" />
  </span>
);

const renderListDetails = (submissionState: ISubmissionState): JSX.Element[] => {
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
      {v}... {submissionState[k] ? <checkCircle.react tag="span" verticalAlign="middle" paddingBottom="2px" /> : spinner}
    </p>
  ));
}

export class FeatureSubmissionStateWidget extends ReactWidget {
  private stateSignal = new Signal<this, ISubmissionState>(this);

  set submissionState(submissionState: ISubmissionState) {
    this.stateSignal.emit(submissionState);
  }

  protected render(): JSX.Element {
    return (
      <div className="assemble-featureSubmissionState">
        <p> Your feature is being submitted... </p>
        <br />
        <div>
          <UseSignal signal={this.stateSignal} initialArgs={{}}>
            {(_, submissionState) => renderListDetails(submissionState)}
          </UseSignal>
        </div>
      </div>
    );
  }
}

export class FeatureSubmittedOkayWidget extends ReactWidget {
  constructor(private url: string, private submissionState: ISubmissionState) {
    super();
    this.addClass('jp-ReactWidget');
  }

  render() {
    return (
      <div className="assemble-featureSubmittedOkay">
        <p> Your feature was submitted! </p>
        <br />
        <div>
          {renderListDetails(this.submissionState)}
        </div>
        <br />
        <p>
          {' '}
          The associated pull request is visible at{' '}
          <a href={this.url} target="_blank">
            {this.url}
          </a>
          .{' '}
        </p>
        <br />
        <p> Please do not submit this same feature more than once. </p>
      </div>
    );
  }
}

export interface IFeatureWidgetState {
  name: string | null;
  similarFeatures: Record<string, { name: string, author: string, code: string }>;
}

export class CheckFeatureWidget extends ReactWidget {
  private stateSignal = new Signal<this, IFeatureWidgetState>(this);

  setState(state: IFeatureWidgetState) {
    this.stateSignal.emit(state);
  }

  constructor(private notebook: Notebook) {
    super();
    this.addClass('jp-ReactWidget');
  }

  private insertCell(code: string) {
    createCellFromCode(this.notebook, code);
    this.parent?.parent?.dispose();
    this.notebook.activeCellIndex += 1;
  }

  render() {
    return <UseSignal signal={this.stateSignal} initialArgs={{ name: null, similarFeatures: {} }}>
      {(_, state) => {
        if (state.similarFeatures) return <div className="assemble-similarFeatures">
          {Object.entries(state.similarFeatures).map(([key, feature]) =>
            <div key={key}>
              <p>
                Feature <b>{state.name}</b> is similar to <b>{feature.name}</b> by
                {' '}
                <a href={'https://github.com/' + feature.author} target="_blank">{feature.author}</a>:
              </p>
              <div className="assemble-actionButtonContainer">
                <button className="jp-Dialog-button jp-mod-accept jp-mod-styled" onClick={() => this.insertCell(feature.code)}>
                  <div className="jp-Dialog-buttonLabel">Insert as new cell</div>
                </button>
              </div>
              <div className="assemble-checkFeature">
                <pre>
                  <code>{feature.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>;
        else if (state.name) return <div> Checking {state.name}... </div>;
        else return <div> Fetching existing features... </div>
      }}
    </UseSignal>
  }
}
