import React from 'react'

import { AnzRow,AnzCol,AnzGrid } from '@anz/grid'
import Text from '@anz/text'
import Section from '@anz/section'
import Bubble from '@anz/bubble'

import {Transform} from './Utils'

class Summary extends React.Component {
  // Constructor 
  constructor(props) {
    super(props);

    this.state = {
        items: [],
        DataisLoaded: false
    };
  }

  // ComponentDidMount is used to
  // execute the code 
  componentDidMount() {
    fetch(
      "https://api-bmn64hwmoa-ts.a.run.app/release", {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then((res) => res.json())
      .then((json) => {
        fetch(
          "https://gist.githubusercontent.com/Ramkrao/d2258ad197cfea8d5c12da758add66dc/raw/6105f65e1a8c39604b3eb46fb8476993e41ec75d/gistfile1.txt")
            .then((res) => res.json())
            .then((resp) => {
              let transformed_json = Transform(json, resp);
              this.setState({
                items: transformed_json,
                DataisLoaded: true
              });
            })
      })
  }

  render() {
    const { items } = this.state;
    return(
      <div>
        <AnzGrid maxWidth='auto' fluid>
          <AnzRow>
            <AnzCol xs={12}>
              <div style={{"margin": "16px 0"}}>
                <Section>
                  <Text heading>Mx Versioner - Application Versions</Text>
                </Section>
              </div>
              <div style={{"margin": "16px 0"}}>
                <Section>
                  {items.map((row) => (
                    <div key={row.repo_name}>
                      <AnzRow key={row.repo_name} style={{"marginTop": "32px"}}>
                        <AnzCol xs={12} md={1} center="xs">
                          <Text heading="4">{row.repo_name}</Text>
                        </AnzCol>
                        {row.versions.map((e) => (
                          <AnzCol xs={12} md={2} key={e.env}>
                            <Bubble
                              id={e.env}
                              percentage='100'
                              bubbleText={e.env}
                              label={e.version}
                              labelFontSize={20}
                              bubbleSize={125}
                              labelPosition='top'
                              statusText={e.version}
                              statusType={e.status}
                              outLineColor={e.color}
                            />
                          </AnzCol>
                        ))}
                      </AnzRow>
                    </div>
                  ))}
                </Section>
              </div>
            </AnzCol>
          </AnzRow>
        </AnzGrid>
      </div>
    )
  }

}

export default Summary
