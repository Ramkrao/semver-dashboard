import React from 'react'

import { AnzRow,AnzCol,AnzGrid } from '@anz/grid'
import Text from '@anz/text'
import Section from '@anz/section'
import Bubble from '@anz/bubble'

import {Transform,
  GetStatusType,
  GetOutlineColor} from './Utils'

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
        "https://api-bmn64hwmoa-ts.a.run.app/release")
          .then((res) => res.json())
          .then((json) => {
            let transformed_json = Transform(json);
            this.setState({
              items: transformed_json,
              DataisLoaded: true
            });
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
                  <Text heading>Summary - Application Versions</Text>
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
                              percentage={e.version}
                              bubbleText={e.version}
                              label={e.env}
                              bubbleSize={125}
                              labelPosition='top'
                              statusType={GetStatusType(e.value)}
                              outLineColor={GetOutlineColor(e.value)}
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
